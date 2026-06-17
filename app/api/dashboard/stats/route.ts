import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// UTC-safe date matching for @db.Date fields (follows project convention)
function toUtcMidnight(d: Date): Date {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return new Date(`${y}-${m}-${day}T00:00:00.000Z`);
}

function shiftDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function shortDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, role: true, restaurantId: true },
    });

    if (!dbUser || !["ADMIN", "SUPER_ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const todayUtc = toUtcMidnight(now);
    const endOfTodayUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000 - 1);
    const startOf14DaysAgo = toUtcMidnight(shiftDays(now, -13));

    const days14: Date[] = [];
    for (let i = 0; i < 14; i++) days14.push(shiftDays(startOf14DaysAgo, i));

    // ── ADMIN ────────────────────────────────────────────────────────────────
    if (dbUser.role === "ADMIN" && dbUser.restaurantId) {
      const rid = dbUser.restaurantId;

      const allStaff = await prisma.user.findMany({
        where: { restaurantId: rid, isActive: true, role: "STAFF" },
        select: { id: true, name: true },
      });
      const totalStaff = allStaff.length;
      const staffIds = allStaff.map((s) => s.id);

      const [todayAtt, todayLeaves, pendingLeaves, attRange, leaveBreakdown] = await Promise.all([
        prisma.attendance.findMany({
          where: { staffId: { in: staffIds }, date: todayUtc },
          select: { staffId: true, entryTime: true, exitTime: true, durationMinutes: true },
        }),
        prisma.leaveRequest.findMany({
          where: {
            staffId: { in: staffIds },
            status: "APPROVED",
            startDate: { lte: endOfTodayUtc },
            endDate: { gte: todayUtc },
          },
          select: { staffId: true },
        }),
        prisma.leaveRequest.count({
          where: { staffId: { in: staffIds }, status: "PENDING" },
        }),
        prisma.attendance.findMany({
          where: {
            staffId: { in: staffIds },
            date: { gte: startOf14DaysAgo, lte: todayUtc },
          },
          select: { date: true },
        }),
        prisma.leaveRequest.findMany({
          where: {
            staffId: { in: staffIds },
            status: "APPROVED",
            startDate: { gte: toUtcMidnight(shiftDays(now, -29)) },
          },
          include: { category: { select: { name: true } } },
        }),
      ]);

      // 14-day trend — group in JS (no N+1)
      const attByDay = new Map<string, number>();
      attRange.forEach((a) => {
        const k = a.date.toISOString().split("T")[0];
        attByDay.set(k, (attByDay.get(k) || 0) + 1);
      });
      const weeklyAttendance = days14.map((d) => {
        const k = d.toISOString().split("T")[0];
        const present = attByDay.get(k) || 0;
        return {
          date: shortDate(d),
          present,
          absent: Math.max(0, totalStaff - present),
          rate: totalStaff > 0 ? Math.round((present / totalStaff) * 100) : 0,
        };
      });

      // Leave type breakdown
      const leaveTypeMap = new Map<string, number>();
      leaveBreakdown.forEach((l) => {
        const name = l.category?.name || "Unknown";
        leaveTypeMap.set(name, (leaveTypeMap.get(name) || 0) + 1);
      });
      const leaveTypeBreakdown = Array.from(leaveTypeMap.entries()).map(([name, count]) => ({ name, count }));

      // Staff presence
      const attMap = new Map(todayAtt.map((a) => [a.staffId, a]));
      const leaveSet = new Set(todayLeaves.map((l) => l.staffId));
      const staffPresence = allStaff.map((s) => {
        const att = attMap.get(s.id);
        if (att) {
          return {
            id: s.id, name: s.name,
            status: att.exitTime ? "completed" : "active",
            entryTime: att.entryTime, exitTime: att.exitTime,
            durationMinutes: att.durationMinutes,
          };
        }
        if (leaveSet.has(s.id)) {
          return { id: s.id, name: s.name, status: "on_leave", entryTime: null, exitTime: null, durationMinutes: null };
        }
        return { id: s.id, name: s.name, status: "absent", entryTime: null, exitTime: null, durationMinutes: null };
      });

      const presentToday = todayAtt.length;
      const onLeaveToday = todayLeaves.length;

      return NextResponse.json({
        role: "ADMIN",
        totalStaff,
        presentToday,
        absentToday: Math.max(0, totalStaff - presentToday - onLeaveToday),
        onLeaveToday,
        pendingLeaves,
        weeklyAttendance,
        leaveTypeBreakdown,
        staffPresence,
      });
    }

    // ── SUPER_ADMIN ──────────────────────────────────────────────────────────
    if (dbUser.role === "SUPER_ADMIN") {
      const restaurants = await prisma.restaurant.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      const allStaff = await prisma.user.findMany({
        where: { isActive: true, role: "STAFF" },
        select: { id: true, restaurantId: true },
      });
      const allStaffIds = allStaff.map((s) => s.id);

      const [todayAtt, todayLeaves, pendingLeaves, pendingList, attRange] = await Promise.all([
        prisma.attendance.findMany({
          where: { staffId: { in: allStaffIds }, date: todayUtc },
          select: { staffId: true },
        }),
        prisma.leaveRequest.findMany({
          where: {
            staffId: { in: allStaffIds },
            status: "APPROVED",
            startDate: { lte: endOfTodayUtc },
            endDate: { gte: todayUtc },
          },
          select: { staffId: true },
        }),
        prisma.leaveRequest.count({
          where: { staffId: { in: allStaffIds }, status: "PENDING" },
        }),
        prisma.leaveRequest.findMany({
          where: { staffId: { in: allStaffIds }, status: "PENDING" },
          select: { staffId: true },
        }),
        prisma.attendance.findMany({
          where: {
            staffId: { in: allStaffIds },
            date: { gte: startOf14DaysAgo, lte: todayUtc },
          },
          select: { staffId: true, date: true },
        }),
      ]);

      const presentSet = new Set(todayAtt.map((a) => a.staffId));
      const leaveSet = new Set(todayLeaves.map((l) => l.staffId));
      const staffRestaurantMap = new Map(allStaff.map((s) => [s.id, s.restaurantId]));

      // Pending by restaurant
      const pendingByRestaurant = new Map<string, number>();
      pendingList.forEach((l) => {
        const rid = staffRestaurantMap.get(l.staffId);
        if (rid) pendingByRestaurant.set(rid, (pendingByRestaurant.get(rid) || 0) + 1);
      });

      // Group staff by restaurant
      const staffByRestaurant = new Map<string, string[]>();
      allStaff.forEach((s) => {
        if (!s.restaurantId) return;
        if (!staffByRestaurant.has(s.restaurantId)) staffByRestaurant.set(s.restaurantId, []);
        staffByRestaurant.get(s.restaurantId)!.push(s.id);
      });

      const restaurantStats = restaurants.map((r) => {
        const sIds = staffByRestaurant.get(r.id) || [];
        const totalStaff = sIds.length;
        const presentToday = sIds.filter((id) => presentSet.has(id)).length;
        const onLeave = sIds.filter((id) => leaveSet.has(id)).length;
        return {
          id: r.id, name: r.name, totalStaff, presentToday, onLeave,
          pendingLeaves: pendingByRestaurant.get(r.id) || 0,
          attendanceRate: totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0,
        };
      });

      // 14-day trend by restaurant — group in JS
      const attByDayRestaurant = new Map<string, Map<string, number>>();
      attRange.forEach((a) => {
        const k = a.date.toISOString().split("T")[0];
        const rid = staffRestaurantMap.get(a.staffId);
        if (!rid) return;
        if (!attByDayRestaurant.has(k)) attByDayRestaurant.set(k, new Map());
        const m = attByDayRestaurant.get(k)!;
        m.set(rid, (m.get(rid) || 0) + 1);
      });

      const weeklyAttendance = days14.map((d) => {
        const k = d.toISOString().split("T")[0];
        const m = attByDayRestaurant.get(k) || new Map();
        const entry: Record<string, number | string> = { date: shortDate(d) };
        restaurants.forEach((r) => { entry[r.name] = m.get(r.id) || 0; });
        return entry;
      });

      return NextResponse.json({
        role: "SUPER_ADMIN",
        totalStaff: allStaff.length,
        totalPresent: todayAtt.length,
        totalPendingLeaves: pendingLeaves,
        restaurantStats,
        weeklyAttendance,
        restaurantNames: restaurants.map((r) => r.name),
      });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (err) {
    console.error("[GET /api/dashboard/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
