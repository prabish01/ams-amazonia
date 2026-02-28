import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  eachDayOfInterval,
  format,
  parseISO,
  differenceInMonths,
} from "date-fns";

const OT_MULTIPLIER = 1.0;
const WEEKLY_OT_THRESHOLD = 44;

// ─── HK Statutory Holidays ────────────────────────────────────────────────────
// 14 statutory holidays per year under HK Employment Ordinance Cap. 57

function getHKStatutoryHolidays(year: number): Set<string> {
  const holidays: Record<number, string[]> = {
    2024: [
      "2024-01-01", // New Year's Day
      "2024-02-10", // Lunar New Year Day 1
      "2024-02-11", // Lunar New Year Day 2
      "2024-02-12", // Lunar New Year Day 3
      "2024-04-04", // Ching Ming Festival
      "2024-05-01", // Labour Day
      "2024-05-15", // Buddha's Birthday
      "2024-06-10", // Tuen Ng Festival
      "2024-07-01", // HKSAR Establishment Day
      "2024-10-01", // National Day
      "2024-10-17", // Day after Mid-Autumn Festival (Mid-Autumn Oct 17)
      "2024-10-11", // Chung Yeung Festival
      "2024-12-25", // Christmas Day
      "2024-12-26", // Day after Christmas
    ],
    2025: [
      "2025-01-01", // New Year's Day
      "2025-01-29", // Lunar New Year Day 1
      "2025-01-30", // Lunar New Year Day 2
      "2025-01-31", // Lunar New Year Day 3
      "2025-04-04", // Ching Ming Festival
      "2025-05-01", // Labour Day
      "2025-05-05", // Buddha's Birthday
      "2025-05-31", // Tuen Ng Festival
      "2025-07-01", // HKSAR Establishment Day
      "2025-10-01", // National Day
      "2025-10-07", // Day after Mid-Autumn Festival (Mid-Autumn Oct 6)
      "2025-10-29", // Chung Yeung Festival
      "2025-12-25", // Christmas Day
      "2025-12-26", // Day after Christmas
    ],
    2026: [
      "2026-01-01", // New Year's Day
      "2026-02-17", // Lunar New Year Day 1
      "2026-02-18", // Lunar New Year Day 2
      "2026-02-19", // Lunar New Year Day 3
      "2026-04-05", // Ching Ming Festival
      "2026-05-01", // Labour Day
      "2026-05-24", // Buddha's Birthday
      "2026-06-20", // Tuen Ng Festival
      "2026-07-01", // HKSAR Establishment Day
      "2026-10-01", // National Day
      "2026-10-04", // Day after Mid-Autumn Festival (Mid-Autumn Oct 3)
      "2026-10-22", // Chung Yeung Festival
      "2026-12-25", // Christmas Day
      "2026-12-26", // Day after Christmas
    ],
  };
  return new Set(holidays[year] ?? []);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampDate(d: Date, lo: Date, hi: Date): Date {
  if (d < lo) return lo;
  if (d > hi) return hi;
  return d;
}

async function resolveHourlyRate(
  staffId: string,
  categoryId: string | null,
  restaurantId: string
): Promise<number> {
  const now = new Date();
  const whereActive = {
    effectiveFrom: { lte: now },
    OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
  };

  const staffRate = await prisma.salaryRate.findFirst({
    where: { staffId, ...whereActive },
    orderBy: { effectiveFrom: "desc" },
  });
  if (staffRate) return parseFloat(String(staffRate.hourlyRate));

  if (categoryId) {
    const catRate = await prisma.salaryRate.findFirst({
      where: { categoryId, staffId: null, ...whereActive },
      orderBy: { effectiveFrom: "desc" },
    });
    if (catRate) return parseFloat(String(catRate.hourlyRate));
  }

  const restRate = await prisma.salaryRate.findFirst({
    where: { restaurantId, staffId: null, categoryId: null, ...whereActive },
    orderBy: { effectiveFrom: "desc" },
  });
  return restRate ? parseFloat(String(restRate.hourlyRate)) : 0;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, role: true, restaurantId: true, name: true },
    });
    if (!dbUser || !["SUPER_ADMIN", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { restaurantId, startDate, endDate, employmentType } = body;

    if (employmentType !== "PART_TIME") {
      return NextResponse.json(
        { error: "Only Part-Time export supported at this stage" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (start > end) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    const targetRestaurantId = restaurantId || dbUser.restaurantId;
    if (!targetRestaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: targetRestaurantId },
      select: { name: true },
    });

    const staffList = await prisma.user.findMany({
      where: {
        restaurantId: targetRestaurantId,
        isActive: true,
        role: "STAFF",
        employmentType: "PART_TIME",
      },
      include: { staffCategory: true },
    });

    if (!staffList.length) {
      return NextResponse.json(
        { error: "No part-time staff found in this restaurant" },
        { status: 400 }
      );
    }

    // Pre-build statutory holiday sets for all years in the range
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const shSets: Map<number, Set<string>> = new Map();
    for (let y = startYear; y <= endYear; y++) {
      shSets.set(y, getHKStatutoryHolidays(y));
    }

    // Weeks in the range (Mon–Sun)
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    const weeks = weekStarts.map((ws) => ({
      weekStart: format(ws, "yyyy-MM-dd"),
      weekEnd: format(endOfWeek(ws, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    }));

    const allDatesInRange = eachDayOfInterval({ start, end });

    const staffRows = await Promise.all(
      staffList.map(async (staff) => {
        const hourlyRate = await resolveHourlyRate(
          staff.id,
          staff.categoryId,
          targetRestaurantId
        );

        const hireDate = new Date(staff.hireDate);

        // Staff is eligible for statutory holidays after 3 months continuous service
        const shEligible = differenceInMonths(start, hireDate) >= 3;

        const attendances = await prisma.attendance.findMany({
          where: { staffId: staff.id, date: { gte: start, lte: end } },
        });

        const leaveRequests = await prisma.leaveRequest.findMany({
          where: {
            staffId: staff.id,
            status: "APPROVED",
            startDate: { lte: end },
            endDate: { gte: start },
          },
          include: { category: true },
        });

        // date -> hours worked
        const attByDate: Record<string, number> = {};
        for (const att of attendances) {
          const key = format(new Date(att.date), "yyyy-MM-dd");
          attByDate[key] = (att.durationMinutes || 0) / 60;
        }

        // Build attendance code map
        const attendanceDates: Record<string, string> = {};

        // 1. Mark approved leave dates
        for (const leave of leaveRequests) {
          const ls = clampDate(
            parseISO(format(new Date(leave.startDate), "yyyy-MM-dd")),
            start,
            end
          );
          const le = clampDate(
            parseISO(format(new Date(leave.endDate), "yyyy-MM-dd")),
            start,
            end
          );
          if (ls <= le) {
            for (const d of eachDayOfInterval({ start: ls, end: le })) {
              const key = format(d, "yyyy-MM-dd");
              const code =
                leave.category.code === "ANNUAL"
                  ? "AL"
                  : leave.category.code === "SICK"
                  ? "SL"
                  : leave.category.code === "STATUTORY"
                  ? "SH"
                  : "UPL";
              attendanceDates[key] = code;
            }
          }
        }

        // 2. Worked days override leave codes
        for (const att of attendances) {
          if ((att.durationMinutes || 0) > 0) {
            attendanceDates[format(new Date(att.date), "yyyy-MM-dd")] = "F";
          }
        }

        // 3. Everything else is OFF first, then check statutory holidays
        for (const d of allDatesInRange) {
          const key = format(d, "yyyy-MM-dd");
          if (!attendanceDates[key]) {
            attendanceDates[key] = "OFF";
          }
        }

        // 4. Auto-mark statutory holidays for eligible staff
        //    Only mark "OFF" dates as "SH" (worked = keep F, leave = keep AL/SL/etc.)
        if (shEligible) {
          for (const d of allDatesInRange) {
            const key = format(d, "yyyy-MM-dd");
            if (attendanceDates[key] === "OFF") {
              const year = d.getFullYear();
              if (shSets.get(year)?.has(key)) {
                attendanceDates[key] = "SH";
              }
            }
          }
        }

        // Leave summary counts
        const leaveSummary = { sh: 0, al: 0, sl: 0, upl: 0 };
        for (const code of Object.values(attendanceDates)) {
          if (code === "SH") leaveSummary.sh++;
          else if (code === "AL") leaveSummary.al++;
          else if (code === "SL") leaveSummary.sl++;
          else if (code === "UPL") leaveSummary.upl++;
        }

        // Weekly breakdown
        const weekRows = weeks.map(({ weekStart, weekEnd }) => {
          const ws = parseISO(weekStart);
          const we = parseISO(weekEnd);
          const clampedStart = clampDate(ws, start, end);
          const clampedEnd = clampDate(we, start, end);
          const weekDays =
            clampedStart <= clampedEnd
              ? eachDayOfInterval({ start: clampedStart, end: clampedEnd })
              : [];

          const dailyHours: Record<string, number> = {};
          let totalHours = 0;
          for (const d of weekDays) {
            const key = format(d, "yyyy-MM-dd");
            const h = attByDate[key] || 0;
            dailyHours[key] = h;
            totalHours += h;
          }

          const regularHours = Math.min(totalHours, WEEKLY_OT_THRESHOLD);
          const overtimeHours = Math.max(0, totalHours - WEEKLY_OT_THRESHOLD);
          const grossPay =
            regularHours * hourlyRate +
            overtimeHours * hourlyRate * OT_MULTIPLIER;

          let leavePay = 0;
          for (const leave of leaveRequests) {
            const ls = clampDate(
              parseISO(format(new Date(leave.startDate), "yyyy-MM-dd")),
              ws,
              we
            );
            const le = clampDate(
              parseISO(format(new Date(leave.endDate), "yyyy-MM-dd")),
              ws,
              we
            );
            const rangeStart = clampDate(ls, start, end);
            const rangeEnd = clampDate(le, start, end);
            if (rangeStart <= rangeEnd) {
              const days = eachDayOfInterval({
                start: rangeStart,
                end: rangeEnd,
              }).length;
              const dailyRate = hourlyRate * 8;
              if (leave.category.payType === "FULL") leavePay += days * dailyRate;
              else if (leave.category.payType === "FOUR_FIFTHS")
                leavePay += days * dailyRate * 0.8;
            }
          }

          return {
            weekStart,
            weekEnd,
            totalHours,
            regularHours,
            overtimeHours,
            grossPay,
            leavePay,
            netPay: grossPay + leavePay,
            dailyHours,
          };
        });

        const totalHours = weekRows.reduce((s, w) => s + w.totalHours, 0);
        const regularHours = weekRows.reduce((s, w) => s + w.regularHours, 0);
        const overtimeHours = weekRows.reduce((s, w) => s + w.overtimeHours, 0);
        const grossPay = weekRows.reduce((s, w) => s + w.grossPay, 0);
        const leavePay = weekRows.reduce((s, w) => s + w.leavePay, 0);

        return {
          staffId: staff.id,
          staffName: staff.name,
          nickname: staff.nickname ?? null,
          position: staff.staffCategory?.name || "Staff",
          hireDate: format(hireDate, "yyyy-MM-dd"),
          hourlyRate,
          shEligible,
          hkid: staff.hkid ?? null,
          bankName: staff.bankName ?? null,
          bankCode: staff.bankCode ?? null,
          bankAccountNumber: staff.bankAccountNumber ?? null,
          attendanceDates,
          leaveSummary,
          weeks: weekRows,
          totalHours,
          regularHours,
          overtimeHours,
          grossPay,
          leavePay,
          deductions: 0,
          netPay: grossPay + leavePay,
        };
      })
    );

    const hasData = staffRows.some((s) =>
      Object.values(s.attendanceDates).some((c) => c !== "OFF")
    );
    if (!hasData) {
      return NextResponse.json(
        { error: "No attendance records found for the selected period" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      period: {
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
      },
      restaurantName: restaurant?.name || "Restaurant",
      generatedBy: dbUser.name,
      staff: staffRows,
      weeks,
    });
  } catch (error) {
    console.error("[POST /api/reports/export]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
