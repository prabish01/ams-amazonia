"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Clock, Users, CalendarDays, TrendingUp, CheckCircle,
  Timer, Building2, UserCheck, Activity,
} from "lucide-react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useTodayAttendance, usePunchIn, usePunchOut, useAttendanceHistory } from "@/hooks/use-attendance";
import { useLeaveBalance } from "@/hooks/use-leaves";
import { useRestaurants } from "@/hooks/use-restaurants";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { toast } from "sonner";
import { format, subDays, intervalToDuration } from "date-fns";

// ─── Constants ───────────────────────────────────────────────────────────────

const RESTAURANT_COLORS = ["#F5A623", "#3B82F6", "#22C55E", "#A855F7"];
const AXIS_STYLE = { fill: "#52525B", fontSize: 10 };
const GRID_COLOR = "#27272A";

// ─── Shared chart tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: "#18181B",
      border: "1px solid #27272A",
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "12px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    }}>
      {label && <p style={{ margin: "0 0 8px", color: "#71717A", fontWeight: 500 }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: "3px 0", color: entry.color || "#E8E8E8" }}>
          <span style={{ fontWeight: 700 }}>{entry.value}</span>
          <span style={{ color: "#71717A", marginLeft: 5 }}>{entry.name}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Staff Dashboard ──────────────────────────────────────────────────────────

function StaffDashboard() {
  const { data: today, isLoading: todayLoading } = useTodayAttendance();
  const { mutate: punchIn, isPending: punchingIn } = usePunchIn();
  const { mutate: punchOut, isPending: punchingOut } = usePunchOut();
  const { data: balances } = useLeaveBalance();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState<string>("");

  const startStr = useMemo(() => format(subDays(new Date(), 29), "yyyy-MM-dd"), []);
  const endStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const { data: monthHistory } = useAttendanceHistory({ start: startStr, end: endStr });

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (today?.entryTime && !today?.exitTime && currentTime) {
      const entry = new Date(today.entryTime);
      const dur = intervalToDuration({ start: entry, end: currentTime });
      const parts: string[] = [];
      if (dur.hours) parts.push(`${dur.hours}h`);
      if (dur.minutes !== undefined) parts.push(`${dur.minutes}m`);
      if (!dur.hours && dur.seconds !== undefined) parts.push(`${dur.seconds}s`);
      setElapsed(parts.join(" "));
    } else {
      setElapsed("");
    }
  }, [currentTime, today]);

  const isClockedIn = today?.entryTime && !today?.exitTime;

  const handlePunch = useCallback(() => {
    if (isClockedIn) {
      punchOut(undefined, {
        onSuccess: () => toast.success("Clocked out successfully"),
        onError: () => toast.error("Failed to clock out"),
      });
    } else {
      punchIn(undefined, {
        onSuccess: () => toast.success("Clocked in! Have a great shift."),
        onError: (err: Error) => toast.error(err.message || "Failed to clock in"),
      });
    }
  }, [isClockedIn, punchIn, punchOut]);

  // 30-day chart data
  const hoursChartData = useMemo(() => {
    if (!monthHistory?.length) return [];
    return [...monthHistory].reverse().map((att) => ({
      date: format(new Date(att.date), "MMM d"),
      hours: parseFloat(((att.durationMinutes || 0) / 60).toFixed(1)),
      isOT: (att.durationMinutes || 0) > 480,
    }));
  }, [monthHistory]);

  // Quick stats
  const quickStats = useMemo(() => {
    if (!monthHistory) return { hoursThisWeek: 0, daysThisMonth: 0, otHoursThisMonth: 0 };
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayTs = new Date(now);
    mondayTs.setDate(mondayTs.getDate() - mondayOffset);
    mondayTs.setHours(0, 0, 0, 0);

    let hoursThisWeek = 0;
    let daysThisMonth = 0;
    let otHoursThisMonth = 0;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    monthHistory.forEach((att) => {
      const attDate = new Date(att.date);
      const mins = att.durationMinutes || 0;
      if (mins > 0) {
        if (attDate >= mondayTs) hoursThisWeek += mins / 60;
        if (attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear) {
          daysThisMonth++;
          if (mins > 480) otHoursThisMonth += (mins - 480) / 60;
        }
      }
    });

    return {
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
      daysThisMonth,
      otHoursThisMonth: Math.round(otHoursThisMonth * 10) / 10,
    };
  }, [monthHistory]);

  const punchColor = isClockedIn ? "#EF4444" : "#22C55E";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Punch Button */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "40px 24px", backgroundColor: "#111113",
        border: "1px solid #27272A", borderRadius: "16px", gap: "20px",
      }}>
        <p style={{ margin: 0, fontSize: "13px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
          {isClockedIn ? "Currently working" : "Ready to start?"}
        </p>
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", inset: -16, borderRadius: "50%",
            border: `2px solid ${punchColor}4D`,
            animation: "pulse-ring 2s ease-in-out infinite", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            border: `2px solid ${punchColor}26`,
            animation: "pulse-ring 2s ease-in-out infinite 0.5s", pointerEvents: "none",
          }} />
          <button
            onClick={handlePunch}
            disabled={punchingIn || punchingOut || todayLoading}
            style={{
              width: 160, height: 160, borderRadius: "50%",
              backgroundColor: isClockedIn ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
              border: `3px solid ${punchColor}`,
              cursor: punchingIn || punchingOut || todayLoading ? "not-allowed" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "8px", color: punchColor,
              transition: "transform 0.1s ease, background-color 0.2s ease",
              boxShadow: `0 0 40px ${punchColor}26`,
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {punchingIn || punchingOut ? (
              <div style={{ width: 32, height: 32, border: `3px solid ${punchColor}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <Clock size={36} strokeWidth={1.5} />
            )}
            <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em" }}>
              {isClockedIn ? "PUNCH OUT" : "PUNCH IN"}
            </span>
          </button>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: 300, color: "#E8E8E8", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
            {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#52525B" }}>
            {currentTime ? format(currentTime, "EEEE, d MMMM yyyy") : ""}
          </p>
        </div>
        {isClockedIn && today?.entryTime && (
          <div style={{ display: "flex", gap: "24px", textAlign: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry</p>
              <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 600, color: "#22C55E" }}>
                {format(new Date(today.entryTime), "HH:mm")}
              </p>
            </div>
            <div style={{ width: "1px", backgroundColor: "#27272A" }} />
            <div>
              <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Duration</p>
              <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 600, color: "#E8E8E8" }}>
                {elapsed || "—"}
              </p>
            </div>
          </div>
        )}
        {!isClockedIn && today?.exitTime && today?.durationMinutes && (
          <div style={{ padding: "10px 20px", backgroundColor: "rgba(34,197,94,0.08)", borderRadius: "8px", border: "1px solid rgba(34,197,94,0.15)" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#22C55E", textAlign: "center" }}>
              Worked {Math.floor(today.durationMinutes / 60)}h {today.durationMinutes % 60}m today
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {[
          { label: "This week", value: `${quickStats.hoursThisWeek}h`, sub: "Hours worked", color: "#3B82F6" },
          { label: "This month", value: `${quickStats.daysThisMonth}d`, sub: "Days attended", color: "#22C55E" },
          { label: "OT this month", value: `${quickStats.otHoursThisMonth}h`, sub: "Overtime hours", color: "#F5A623" },
        ].map((s) => (
          <div key={s.label} style={{
            backgroundColor: "#111113", border: "1px solid #27272A",
            borderRadius: "10px", padding: "14px 16px",
            borderTop: `2px solid ${s.color}`,
          }}>
            <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>{s.value}</p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#52525B" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 30-day Hours Chart */}
      <Card>
        <CardHeader
          title="My Work Hours"
          subtitle="Last 30 days · orange bars = overtime"
          icon={<Activity size={14} />}
        />
        <CardBody>
          {hoursChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hoursChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="hours" name="Hours" maxBarSize={14} radius={[3, 3, 0, 0]}>
                  {hoursChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.isOT ? "#F5A623" : "#3B82F6"} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#52525B" }}>No attendance data yet</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Leave Balances */}
      <div>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Leave Balances
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
          {balances?.map((b) => {
            const pct = b.allocated > 0 ? Math.round((b.used / b.allocated) * 100) : 0;
            return (
              <div key={b.id} style={{
                backgroundColor: "#111113", border: "1px solid #27272A",
                borderRadius: "10px", padding: "14px",
              }}>
                <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#52525B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {b.category?.name || "—"}
                </p>
                <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>
                  {b.remaining}
                  <span style={{ fontSize: "13px", fontWeight: 400, color: "#52525B" }}>/{b.allocated}</span>
                </p>
                <p style={{ margin: "4px 0 8px", fontSize: "11px", color: "#52525B" }}>
                  {b.used} used · {b.pending} pending
                </p>
                {/* Progress bar */}
                <div style={{ height: 4, borderRadius: 2, backgroundColor: "#27272A", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${pct}%`,
                    backgroundColor: pct > 80 ? "#EF4444" : pct > 50 ? "#EAB308" : "#22C55E",
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            );
          })}
          {!balances?.length && (
            <div style={{ backgroundColor: "#111113", border: "1px solid #27272A", borderRadius: "10px", padding: "14px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#52525B" }}>No leave balances</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>
          <SkeletonCard style={{ height: 280 }} />
          <SkeletonCard style={{ height: 280 }} />
        </div>
        <SkeletonCard style={{ height: 320 }} />
      </div>
    );
  }

  if (!stats) return null;

  const donutData = [
    { name: "Present", value: stats.presentToday, color: "#22C55E" },
    { name: "On Leave", value: stats.onLeaveToday, color: "#EAB308" },
    { name: "Absent", value: stats.absentToday, color: "#3F3F46" },
  ].filter((d) => d.value > 0);

  const todayRate = stats.totalStaff > 0
    ? Math.round((stats.presentToday / stats.totalStaff) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        <StatCard title="Total Staff" value={stats.totalStaff} icon={<Users size={16} />} subtitle="Active members" color="#3B82F6" />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={<CheckCircle size={16} />}
          subtitle={`${todayRate}% attendance rate`}
          color="#22C55E"
          trend={{ direction: todayRate >= 80 ? "positive" : todayRate >= 50 ? "neutral" : "negative", value: `${todayRate}%`, label: " today" }}
        />
        <StatCard title="On Leave" value={stats.onLeaveToday} icon={<CalendarDays size={16} />} subtitle="Approved leave today" color="#EAB308" />
        <StatCard title="Pending Leaves" value={stats.pendingLeaves} icon={<Timer size={16} />} subtitle="Awaiting approval" color="#EF4444" />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>
        {/* 14-day trend */}
        <Card>
          <CardHeader title="Attendance Trend" subtitle="Last 14 days · attendance rate %" icon={<TrendingUp size={14} />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={stats.weeklyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Area type="monotone" dataKey="rate" name="Attendance %" stroke="#22C55E" strokeWidth={2} fill="url(#attGrad)" dot={false} activeDot={{ r: 4, fill: "#22C55E", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Today's snapshot donut */}
        <Card>
          <CardHeader title="Today's Snapshot" subtitle="Staff status breakdown" icon={<Users size={14} />} />
          <CardBody>
            <div style={{ position: "relative" }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={2} dataKey="value" strokeWidth={0}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none",
              }}>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#E8E8E8" }}>{stats.totalStaff}</p>
                <p style={{ margin: 0, fontSize: "10px", color: "#52525B" }}>total</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              {[
                { label: "Present", value: stats.presentToday, color: "#22C55E" },
                { label: "On Leave", value: stats.onLeaveToday, color: "#EAB308" },
                { label: "Absent", value: stats.absentToday, color: "#52525B" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "#A1A1AA" }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#E8E8E8" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Staff Presence List */}
      <Card>
        <CardHeader
          title="Today's Staff"
          subtitle={format(new Date(), "EEEE, d MMMM yyyy")}
          icon={<UserCheck size={14} />}
        />
        <CardBody padding={false}>
          {stats.staffPresence?.length > 0 ? (
            <>
              {stats.staffPresence.map((s: {
                id: string; name: string;
                status: "active" | "completed" | "on_leave" | "absent";
                entryTime: string | null; exitTime: string | null; durationMinutes: number | null;
              }, i: number) => {
                const statusColor = { active: "#22C55E", completed: "#3B82F6", on_leave: "#EAB308", absent: "#3F3F46" }[s.status];
                const badgeVariant = { active: "success", completed: "info", on_leave: "warning", absent: "neutral" }[s.status] as "success" | "info" | "warning" | "neutral";
                const badgeLabel = { active: "Active", completed: "Done", on_leave: "On Leave", absent: "Absent" }[s.status];
                return (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 20px",
                    borderBottom: i < stats.staffPresence.length - 1 ? "1px solid #1A1A1E" : undefined,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusColor, flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>{s.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {s.entryTime && (
                        <span style={{ fontSize: "12px", color: "#52525B" }}>
                          {format(new Date(s.entryTime), "HH:mm")}
                          {s.exitTime ? ` → ${format(new Date(s.exitTime), "HH:mm")}` : " → now"}
                          {s.durationMinutes ? ` · ${Math.floor(s.durationMinutes / 60)}h ${s.durationMinutes % 60}m` : ""}
                        </span>
                      )}
                      <Badge variant={badgeVariant} size="sm">{badgeLabel}</Badge>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#52525B" }}>No staff data available</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ─── SuperAdmin Dashboard ─────────────────────────────────────────────────────

function SuperAdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: restaurants, isLoading: restaurantsLoading } = useRestaurants();

  if (isLoading || restaurantsLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <SkeletonCard style={{ height: 280 }} />
          <SkeletonCard style={{ height: 280 }} />
        </div>
        <SkeletonCard style={{ height: 260 }} />
      </div>
    );
  }

  const networkRate = stats?.totalStaff > 0
    ? Math.round((stats.totalPresent / stats.totalStaff) * 100)
    : 0;

  // Comparison chart data
  const comparisonData = stats?.restaurantStats?.map((r: {
    name: string; totalStaff: number; presentToday: number; onLeave: number;
  }) => ({
    name: r.name.length > 12 ? r.name.substring(0, 12) + "…" : r.name,
    "Total Staff": r.totalStaff,
    "Present": r.presentToday,
    "On Leave": r.onLeave,
  })) || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        <StatCard
          title="Restaurants"
          value={restaurants?.length || 0}
          icon={<Building2 size={16} />}
          subtitle="Active locations"
          color="#F5A623"
        />
        <StatCard
          title="Total Staff"
          value={stats?.totalStaff || 0}
          icon={<Users size={16} />}
          subtitle="Across all restaurants"
          color="#3B82F6"
        />
        <StatCard
          title="Present Today"
          value={stats?.totalPresent || 0}
          icon={<CheckCircle size={16} />}
          subtitle={`${networkRate}% network rate`}
          color="#22C55E"
          trend={{ direction: networkRate >= 80 ? "positive" : networkRate >= 50 ? "neutral" : "negative", value: `${networkRate}%`, label: " rate" }}
        />
        <StatCard
          title="Pending Leaves"
          value={stats?.totalPendingLeaves || 0}
          icon={<CalendarDays size={16} />}
          subtitle="Awaiting approval"
          color="#EAB308"
        />
      </div>

      {/* Two-column charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Restaurant Comparison */}
        <Card>
          <CardHeader title="Restaurant Comparison" subtitle="Today's attendance vs headcount" icon={<Building2 size={14} />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#71717A" }} />
                <Bar dataKey="Total Staff" fill="#27272A" radius={[3, 3, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Present" fill="#22C55E" fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={20} />
                <Bar dataKey="On Leave" fill="#EAB308" fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Restaurant cards with rate indicators */}
        <Card>
          <CardHeader title="Live Restaurant Status" subtitle="Attendance rate today" icon={<Activity size={14} />} />
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {stats?.restaurantStats?.map((r: {
                id: string; name: string; totalStaff: number; presentToday: number;
                onLeave: number; pendingLeaves: number; attendanceRate: number;
              }, i: number) => (
                <div key={r.id} style={{
                  backgroundColor: "#0E0E10", borderRadius: "10px",
                  padding: "14px 16px", border: "1px solid #1A1A1E",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "8px", flexShrink: 0,
                        backgroundColor: `${RESTAURANT_COLORS[i % RESTAURANT_COLORS.length]}18`,
                        border: `1px solid ${RESTAURANT_COLORS[i % RESTAURANT_COLORS.length]}33`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", fontWeight: 700, color: RESTAURANT_COLORS[i % RESTAURANT_COLORS.length],
                      }}>
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#E8E8E8" }}>{r.name}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "#52525B" }}>
                          {r.presentToday}/{r.totalStaff} in · {r.onLeave} leave
                          {r.pendingLeaves > 0 && ` · ${r.pendingLeaves} pending`}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: r.attendanceRate >= 80 ? "#22C55E" : r.attendanceRate >= 50 ? "#EAB308" : "#EF4444" }}>
                      {r.attendanceRate}%
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, backgroundColor: "#1A1A1E", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: `${r.attendanceRate}%`,
                      backgroundColor: r.attendanceRate >= 80 ? "#22C55E" : r.attendanceRate >= 50 ? "#EAB308" : "#EF4444",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 14-day Network Trend */}
      {stats?.restaurantNames?.length > 0 && (
        <Card>
          <CardHeader title="14-Day Network Attendance" subtitle="Staff present per day by restaurant" icon={<TrendingUp size={14} />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.weeklyAttendance} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#27272A", strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#71717A" }} />
                {stats.restaurantNames.map((name: string, i: number) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={RESTAURANT_COLORS[i % RESTAURANT_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: auth, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <SkeletonLine height={28} width="200px" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const role = auth?.role;
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>
          {greeting()}, {auth?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
      </div>

      {role === "STAFF" && <StaffDashboard />}
      {role === "ADMIN" && <AdminDashboard />}
      {role === "SUPER_ADMIN" && <SuperAdminDashboard />}
    </div>
  );
}
