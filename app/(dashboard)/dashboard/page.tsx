"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Clock,
  Users,
  CalendarDays,
  TrendingUp,
  CheckCircle,
  XCircle,
  Timer,
  Building2,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useTodayAttendance, usePunchIn, usePunchOut, useAttendanceHistory } from "@/hooks/use-attendance";
import { useLeaveBalance } from "@/hooks/use-leaves";
import { useRestaurants } from "@/hooks/use-restaurants";
import { toast } from "sonner";
import { format, formatDuration, intervalToDuration } from "date-fns";

// ─── Staff Dashboard ────────────────────────────────────────────────────────

function StaffDashboard() {
  const { data: today, isLoading: todayLoading } = useTodayAttendance();
  const { mutate: punchIn, isPending: punchingIn } = usePunchIn();
  const { mutate: punchOut, isPending: punchingOut } = usePunchOut();
  const { data: history } = useAttendanceHistory({ limit: 5 });
  const { data: balances } = useLeaveBalance();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsed, setElapsed] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (today?.entryTime && !today?.exitTime) {
      const entry = new Date(today.entryTime);
      const dur = intervalToDuration({ start: entry, end: currentTime });
      const parts = [];
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Punch Button Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 24px",
          backgroundColor: "#111113",
          border: "1px solid #27272A",
          borderRadius: "16px",
          gap: "20px",
        }}
      >
        <p style={{ margin: 0, fontSize: "13px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
          {isClockedIn ? "Currently working" : "Ready to start?"}
        </p>

        {/* Punch button */}
        <div style={{ position: "relative" }}>
          {isClockedIn && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: -16,
                  borderRadius: "50%",
                  border: "2px solid rgba(239,68,68,0.3)",
                  animation: "pulse-ring 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: "50%",
                  border: "2px solid rgba(239,68,68,0.15)",
                  animation: "pulse-ring 2s ease-in-out infinite 0.5s",
                }}
              />
            </>
          )}
          {!isClockedIn && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: -16,
                  borderRadius: "50%",
                  border: "2px solid rgba(34,197,94,0.3)",
                  animation: "pulse-ring 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: "50%",
                  border: "2px solid rgba(34,197,94,0.15)",
                  animation: "pulse-ring 2s ease-in-out infinite 0.5s",
                }}
              />
            </>
          )}
          <button
            onClick={handlePunch}
            disabled={punchingIn || punchingOut || todayLoading}
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              backgroundColor: isClockedIn ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
              border: `3px solid ${isClockedIn ? "#EF4444" : "#22C55E"}`,
              cursor: punchingIn || punchingOut || todayLoading ? "not-allowed" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: isClockedIn ? "#EF4444" : "#22C55E",
              transition: "transform 0.1s ease, background-color 0.2s ease",
              boxShadow: isClockedIn
                ? "0 0 40px rgba(239,68,68,0.15)"
                : "0 0 40px rgba(34,197,94,0.15)",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {punchingIn || punchingOut ? (
              <div style={{ width: 32, height: 32, border: `3px solid ${isClockedIn ? "#EF4444" : "#22C55E"}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <Clock size={36} strokeWidth={1.5} />
            )}
            <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em" }}>
              {isClockedIn ? "PUNCH OUT" : "PUNCH IN"}
            </span>
          </button>
        </div>

        {/* Time info */}
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: 300, color: "#E8E8E8", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
            {format(currentTime, "HH:mm:ss")}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#52525B" }}>
            {format(currentTime, "EEEE, d MMMM yyyy")}
          </p>
        </div>

        {/* Status info */}
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

      {/* Leave Balances */}
      <div>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Leave Balances
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
          {balances?.map((b) => (
            <div
              key={b.id}
              style={{
                backgroundColor: "#111113",
                border: "1px solid #27272A",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#52525B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {b.category?.name || "—"}
              </p>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>
                {b.remaining}
                <span style={{ fontSize: "13px", fontWeight: 400, color: "#52525B" }}>/{b.allocated}</span>
              </p>
              <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#52525B" }}>
                {b.used} used · {b.pending} pending
              </p>
            </div>
          ))}
          {!balances?.length && (
            <div style={{ backgroundColor: "#111113", border: "1px solid #27272A", borderRadius: "10px", padding: "14px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#52525B" }}>No leave balances</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent attendance */}
      <Card>
        <CardHeader title="Recent Attendance" subtitle="Last 5 days" icon={<Clock size={14} />} />
        <CardBody padding={false}>
          {history?.slice(0, 5).map((att, i) => (
            <div
              key={att.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                borderBottom: i < Math.min((history?.length || 0), 5) - 1 ? "1px solid #1A1A1E" : undefined,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>
                  {format(new Date(att.date), "EEE, d MMM")}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#52525B" }}>
                  {att.entryTime ? format(new Date(att.entryTime), "HH:mm") : "—"}
                  {att.exitTime ? ` → ${format(new Date(att.exitTime), "HH:mm")}` : " → ongoing"}
                </p>
              </div>
              <Badge variant={att.exitTime ? "success" : att.entryTime ? "warning" : "neutral"} size="sm">
                {att.durationMinutes
                  ? `${Math.floor(att.durationMinutes / 60)}h ${att.durationMinutes % 60}m`
                  : att.entryTime ? "Active" : "Absent"}
              </Badge>
            </div>
          ))}
          {!history?.length && (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#52525B" }}>No attendance records yet</p>
            </div>
          )}
        </CardBody>
      </Card>

      <style>{`
        @keyframes pulse-ring {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────

function AdminDashboard() {
  const { data: balance } = useLeaveBalance();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        <StatCard
          title="Total Staff"
          value="—"
          icon={<Users size={16} />}
          subtitle="In your restaurant"
          color="#3B82F6"
        />
        <StatCard
          title="Present Today"
          value="—"
          icon={<CheckCircle size={16} />}
          subtitle="Clocked in today"
          color="#22C55E"
        />
        <StatCard
          title="On Leave"
          value="—"
          icon={<CalendarDays size={16} />}
          subtitle="Active today"
          color="#EAB308"
        />
        <StatCard
          title="Pending Leaves"
          value="—"
          icon={<Timer size={16} />}
          subtitle="Needs approval"
          color="#F5A623"
        />
      </div>

      <Card>
        <CardHeader
          title="Today's Attendance"
          subtitle={format(new Date(), "EEEE, d MMMM yyyy")}
          icon={<Clock size={14} />}
        />
        <CardBody>
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#52525B" }}>
              Attendance data will appear here
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── SuperAdmin Dashboard ────────────────────────────────────────────────────

function SuperAdminDashboard() {
  const { data: restaurants, isLoading } = useRestaurants();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
          value={restaurants?.reduce((sum, r) => sum + (r._count?.staff || 0), 0) || 0}
          icon={<Users size={16} />}
          subtitle="Across all restaurants"
          color="#3B82F6"
        />
        <StatCard
          title="Attendance Rate"
          value="—%"
          icon={<TrendingUp size={16} />}
          subtitle="Today's rate"
          color="#22C55E"
        />
        <StatCard
          title="Pending Leaves"
          value="—"
          icon={<CalendarDays size={16} />}
          subtitle="Awaiting approval"
          color="#EAB308"
        />
      </div>

      <div>
        <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 600, color: "#E8E8E8" }}>
          Restaurants Overview
        </h3>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {restaurants?.map((r) => (
              <Card key={r.id} hoverable>
                <CardBody>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "10px",
                        backgroundColor: "rgba(245,166,35,0.1)",
                        border: "1px solid rgba(245,166,35,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#F5A623",
                        flexShrink: 0,
                      }}
                    >
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#E8E8E8" }}>{r.name}</p>
                      {r.cuisineType && (
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#52525B" }}>{r.cuisineType}</p>
                      )}
                    </div>
                    <Badge variant={r.isActive ? "success" : "neutral"} size="sm" style={{ marginLeft: "auto" }}>
                      {r.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#E8E8E8" }}>
                        {r._count?.staff || 0}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#52525B" }}>Staff</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: auth, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <SkeletonLine height={28} width="200px" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
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
