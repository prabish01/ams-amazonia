import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const STANDARD_HOURS_PER_DAY = 8;
const OVERTIME_RATE_MULTIPLIER = 1.5;

async function getStaffReport(
  staffId: string,
  restaurantId: string,
  start: Date,
  end: Date,
  reporterRole: string
) {
  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    include: { staffCategory: true },
  });

  if (!staff) return null;

  const attendances = await prisma.attendance.findMany({
    where: {
      staffId,
      date: { gte: start, lte: end },
    },
  });

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      staffId,
      status: "APPROVED",
      startDate: { gte: start },
      endDate: { lte: end },
    },
    include: { category: true },
  });

  // Get effective hourly rate
  const now = new Date();
  const rateRecord = await prisma.salaryRate.findFirst({
    where: {
      staffId,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  const categoryRateRecord = staff.categoryId
    ? await prisma.salaryRate.findFirst({
        where: {
          categoryId: staff.categoryId,
          staffId: null,
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        orderBy: { effectiveFrom: "desc" },
      })
    : null;

  const hourlyRate = parseFloat(
    String(rateRecord?.hourlyRate ?? categoryRateRecord?.hourlyRate ?? "0")
  );

  // Calculate totals
  const totalMinutes = attendances.reduce((sum: number, a: { durationMinutes: number | null }) => sum + (a.durationMinutes || 0), 0);
  const totalHours = totalMinutes / 60;

  const workingDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const standardHours = workingDays * STANDARD_HOURS_PER_DAY;
  const regularHours = Math.min(totalHours, standardHours);
  const overtimeHours = Math.max(0, totalHours - standardHours);

  const grossEarnings =
    regularHours * hourlyRate + overtimeHours * hourlyRate * OVERTIME_RATE_MULTIPLIER;

  const leaveDays = leaveRequests.reduce((sum: number, l: { daysRequested: number }) => sum + l.daysRequested, 0);
  const leavePayments = leaveRequests.reduce((acc: number, req: { daysRequested: number; category: { payType: string } | null }) => {
    if (!req.category) return acc;
    const days = req.daysRequested;
    if (req.category.payType === "FULL") return acc + days * STANDARD_HOURS_PER_DAY * hourlyRate;
    if (req.category.payType === "FOUR_FIFTHS") return acc + days * STANDARD_HOURS_PER_DAY * hourlyRate * 0.8;
    return acc; // UNPAID
  }, 0);

  const totalPayable = grossEarnings + leavePayments;

  return {
    staffId: staff.id,
    staffName: staff.name,
    totalHours,
    regularHours,
    overtimeHours,
    hourlyRate,
    grossEarnings,
    leavePayments,
    holidayPay: 0,
    totalPayable,
    leaveDays,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, role: true, restaurantId: true },
    });

    if (!dbUser || !["SUPER_ADMIN", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, staffId, restaurantId, start, end } = body;

    if (!start || !end) {
      return NextResponse.json({ error: "start and end dates are required" }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const targetRestaurantId = restaurantId || dbUser.restaurantId || "";

    let rows: Awaited<ReturnType<typeof getStaffReport>>[] = [];

    if (type === "individual") {
      if (!staffId) {
        return NextResponse.json({ error: "staffId is required for individual report" }, { status: 400 });
      }
      const row = await getStaffReport(staffId, targetRestaurantId, startDate, endDate, dbUser.role);
      rows = row ? [row] : [];
    } else if (type === "restaurant") {
      const staffList = await prisma.user.findMany({
        where: {
          restaurantId: targetRestaurantId,
          isActive: true,
          role: "STAFF",
        },
        select: { id: true },
      });
      rows = await Promise.all(
        staffList.map((s: { id: string }) => getStaffReport(s.id, targetRestaurantId, startDate, endDate, dbUser.role))
      );
      rows = rows.filter(Boolean);
    } else if (type === "all" && dbUser.role === "SUPER_ADMIN") {
      const allStaff = await prisma.user.findMany({
        where: { isActive: true, role: "STAFF" },
        select: { id: true, restaurantId: true },
      });
      rows = await Promise.all(
        allStaff.map((s: { id: string; restaurantId: string | null }) => getStaffReport(s.id, s.restaurantId || "", startDate, endDate, dbUser.role))
      );
      rows = rows.filter(Boolean);
    } else {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    return NextResponse.json({
      rows,
      period: { start, end },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[POST /api/reports/generate]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
