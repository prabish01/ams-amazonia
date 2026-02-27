"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { Clock, CalendarDays, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useTodayAttendance, usePunchIn, usePunchOut, useAttendanceHistory } from "@/hooks/use-attendance";
import { toast } from "sonner";

type Period = "this-week" | "last-week" | "this-month" | "last-month";

function getPeriodDates(period: Period): { start: string; end: string } {
  const now = new Date();
  switch (period) {
    case "this-week":
      return {
        start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "last-week": {
      const lastWeek = subWeeks(now, 1);
      return {
        start: format(startOfWeek(lastWeek, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: format(endOfWeek(lastWeek, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    }
    case "this-month":
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "last-month": {
      const lastMonth = subMonths(now, 1);
      return {
        start: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        end: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
      };
    }
  }
}

const periodLabels: Record<Period, string> = {
  "this-week": "This Week",
  "last-week": "Last Week",
  "this-month": "This Month",
  "last-month": "Last Month",
};

export default function AttendancePage() {
  const [period, setPeriod] = useState<Period>("this-week");
  const [periodOpen, setPeriodOpen] = useState(false);
  const { start, end } = getPeriodDates(period);

  const { data: today, isLoading: todayLoading } = useTodayAttendance();
  const { mutate: punchIn, isPending: punchingIn } = usePunchIn();
  const { mutate: punchOut, isPending: punchingOut } = usePunchOut();
  const { data: history, isLoading: historyLoading } = useAttendanceHistory({ start, end });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (today?.entryTime && !today?.exitTime) {
      const entry = new Date(today.entryTime);
      const diff = currentTime.getTime() - entry.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h}h ${m}m ${s}s`);
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
        onSuccess: () => toast.success("Clocked in!"),
        onError: (err: Error) => toast.error(err.message || "Failed to clock in"),
      });
    }
  }, [isClockedIn, punchIn, punchOut]);

  const totalMinutes = history?.reduce((sum, a) => sum + (a.durationMinutes || 0), 0) || 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>Attendance</h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
          Track your working hours
        </p>
      </div>

      {/* Punch section */}
      <div
        style={{
          backgroundColor: "#111113",
          border: "1px solid #27272A",
          borderRadius: "16px",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div style={{ position: "relative" }}>
          {!isClockedIn && (
            <div style={{ position: "absolute", inset: -12, borderRadius: "50%", border: "2px solid rgba(34,197,94,0.25)", animation: "pulse-ring 2.5s ease-in-out infinite" }} />
          )}
          {isClockedIn && (
            <div style={{ position: "absolute", inset: -12, borderRadius: "50%", border: "2px solid rgba(239,68,68,0.25)", animation: "pulse-ring 2.5s ease-in-out infinite" }} />
          )}
          <button
            onClick={handlePunch}
            disabled={punchingIn || punchingOut || todayLoading}
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              backgroundColor: isClockedIn ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
              border: `3px solid ${isClockedIn ? "#EF4444" : "#22C55E"}`,
              cursor: punchingIn || punchingOut || todayLoading ? "not-allowed" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: isClockedIn ? "#EF4444" : "#22C55E",
              transition: "transform 0.1s ease",
              boxShadow: isClockedIn
                ? "0 0 32px rgba(239,68,68,0.12)"
                : "0 0 32px rgba(34,197,94,0.12)",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {punchingIn || punchingOut ? (
              <div style={{ width: 28, height: 28, border: `2.5px solid currentColor`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <Clock size={32} strokeWidth={1.5} />
            )}
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em" }}>
              {isClockedIn ? "PUNCH OUT" : "PUNCH IN"}
            </span>
          </button>
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "26px", fontWeight: 300, color: "#E8E8E8", fontVariantNumeric: "tabular-nums" }}>
            {format(currentTime, "HH:mm:ss")}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#52525B" }}>
            {format(currentTime, "EEEE, d MMMM yyyy")}
          </p>
        </div>

        {isClockedIn && today?.entryTime && (
          <div
            style={{
              display: "flex",
              gap: "20px",
              padding: "12px 24px",
              backgroundColor: "#1A1A1E",
              borderRadius: "10px",
              border: "1px solid #27272A",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry</p>
              <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700, color: "#22C55E" }}>
                {format(new Date(today.entryTime), "HH:mm")}
              </p>
            </div>
            <div style={{ width: 1, backgroundColor: "#27272A" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Elapsed</p>
              <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700, color: "#E8E8E8", fontVariantNumeric: "tabular-nums" }}>
                {elapsed}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Period summary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ backgroundColor: "#111113", border: "1px solid #27272A", borderRadius: "10px", padding: "10px 16px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Period Hours</p>
            <p style={{ margin: "3px 0 0", fontSize: "20px", fontWeight: 700, color: "#F5A623" }}>
              {totalHours}h {remainingMinutes}m
            </p>
          </div>
          <div style={{ backgroundColor: "#111113", border: "1px solid #27272A", borderRadius: "10px", padding: "10px 16px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Days Worked</p>
            <p style={{ margin: "3px 0 0", fontSize: "20px", fontWeight: 700, color: "#E8E8E8" }}>
              {history?.filter((a) => a.durationMinutes).length || 0}
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#111113",
              border: "1px solid #27272A",
              borderRadius: "8px",
              padding: "8px 14px",
              color: "#E8E8E8",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3F3F46"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#27272A"; }}
          >
            <CalendarDays size={14} style={{ color: "#F5A623" }} />
            {periodLabels[period]}
            <ChevronDown size={14} style={{ color: "#52525B" }} />
          </button>
          {periodOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                backgroundColor: "#111113",
                border: "1px solid #27272A",
                borderRadius: "8px",
                overflow: "hidden",
                zIndex: 100,
                minWidth: "160px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            >
              {(Object.entries(periodLabels) as [Period, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setPeriod(key); setPeriodOpen(false); }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: period === key ? "rgba(245,166,35,0.08)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: period === key ? "#F5A623" : "#A1A1AA",
                    fontSize: "13px",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (period !== key) e.currentTarget.style.backgroundColor = "#1A1A1E"; }}
                  onMouseLeave={(e) => { if (period !== key) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* History table */}
      <Card>
        <CardHeader title="Attendance History" subtitle={`${start} to ${end}`} icon={<CalendarDays size={14} />} />
        <CardBody padding={false}>
          {historyLoading ? (
            <div style={{ padding: "16px" }}>
              <SkeletonTable rows={5} cols={5} />
            </div>
          ) : (
            <>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 100px 100px 80px",
                  padding: "10px 20px",
                  borderBottom: "1px solid #27272A",
                  gap: "12px",
                }}
              >
                {["Date", "Entry", "Exit", "Duration", "Status"].map((h) => (
                  <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </span>
                ))}
              </div>

              {history?.length ? history.map((att, i) => (
                <div
                  key={att.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 100px 100px 80px",
                    padding: "14px 20px",
                    borderBottom: i < history.length - 1 ? "1px solid #1A1A1E" : undefined,
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>
                    {format(new Date(att.date), "EEE, d MMM")}
                  </span>
                  <span style={{ fontSize: "13px", color: "#A1A1AA", fontVariantNumeric: "tabular-nums" }}>
                    {att.entryTime ? format(new Date(att.entryTime), "HH:mm") : "—"}
                  </span>
                  <span style={{ fontSize: "13px", color: "#A1A1AA", fontVariantNumeric: "tabular-nums" }}>
                    {att.exitTime ? format(new Date(att.exitTime), "HH:mm") : att.entryTime ? "—" : "—"}
                  </span>
                  <span style={{ fontSize: "13px", color: "#A1A1AA", fontVariantNumeric: "tabular-nums" }}>
                    {att.durationMinutes
                      ? `${Math.floor(att.durationMinutes / 60)}h ${att.durationMinutes % 60}m`
                      : "—"}
                  </span>
                  <Badge
                    size="sm"
                    variant={
                      att.exitTime
                        ? "success"
                        : att.entryTime
                        ? "warning"
                        : "neutral"
                    }
                  >
                    {att.exitTime ? "Done" : att.entryTime ? "Active" : "—"}
                  </Badge>
                </div>
              )) : (
                <div style={{ padding: "32px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#52525B" }}>
                    No attendance records for this period
                  </p>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.08); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
