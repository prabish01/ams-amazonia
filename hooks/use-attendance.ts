"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { Attendance } from "@/types";
import { useAuth } from "./use-auth";

// ─── Today's attendance ─────────────────────────────────────────────────────

async function fetchTodayAttendance(): Promise<Attendance | null> {
  const res = await fetch("/api/attendance/today");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch today's attendance");
  }
  return res.json();
}

export function useTodayAttendance() {
  const { data: auth } = useAuth();
  return useQuery<Attendance | null>({
    queryKey: queryKeys.attendance.todayStatus(auth?.id || ""),
    queryFn: fetchTodayAttendance,
    enabled: !!auth?.id,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

// ─── Punch In ───────────────────────────────────────────────────────────────

async function punchIn(): Promise<Attendance> {
  const res = await fetch("/api/attendance/punch-in", { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to punch in");
  }
  return res.json();
}

export function usePunchIn() {
  const queryClient = useQueryClient();
  const { data: auth } = useAuth();

  return useMutation({
    mutationFn: punchIn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.todayStatus(auth?.id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.byStaff(auth?.id || ""),
      });
    },
  });
}

// ─── Punch Out ──────────────────────────────────────────────────────────────

async function punchOut(): Promise<Attendance> {
  const res = await fetch("/api/attendance/punch-out", { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to punch out");
  }
  return res.json();
}

export function usePunchOut() {
  const queryClient = useQueryClient();
  const { data: auth } = useAuth();

  return useMutation({
    mutationFn: punchOut,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.todayStatus(auth?.id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.byStaff(auth?.id || ""),
      });
    },
  });
}

// ─── Attendance History ──────────────────────────────────────────────────────

interface AttendanceHistoryParams {
  start?: string;
  end?: string;
  staffId?: string;
  limit?: number;
}

async function fetchAttendanceHistory(params: AttendanceHistoryParams): Promise<Attendance[]> {
  const searchParams = new URLSearchParams();
  if (params.start) searchParams.set("start", params.start);
  if (params.end) searchParams.set("end", params.end);
  if (params.staffId) searchParams.set("staffId", params.staffId);
  if (params.limit) searchParams.set("limit", params.limit.toString());

  const res = await fetch(`/api/attendance/history?${searchParams.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch attendance history");
  }
  return res.json();
}

export function useAttendanceHistory(params: AttendanceHistoryParams = {}) {
  const { data: auth } = useAuth();
  return useQuery<Attendance[]>({
    queryKey: queryKeys.attendance.byStaff(auth?.id || "", params.start, params.end),
    queryFn: () => fetchAttendanceHistory(params),
    enabled: !!auth?.id,
    staleTime: 30_000,
  });
}
