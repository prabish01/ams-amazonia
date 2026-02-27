"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { LeaveCategory, LeaveRequest, LeaveBalance } from "@/types";
import { useAuth } from "./use-auth";

// ─── Leave Categories ────────────────────────────────────────────────────────

async function fetchLeaveCategories(): Promise<LeaveCategory[]> {
  const res = await fetch("/api/leaves/categories");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch leave categories");
  }
  return res.json();
}

export function useLeaveCategories() {
  return useQuery<LeaveCategory[]>({
    queryKey: queryKeys.leaves.categories,
    queryFn: fetchLeaveCategories,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Leave Requests ──────────────────────────────────────────────────────────

interface LeaveRequestFilters {
  status?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

async function fetchLeaveRequests(filters: LeaveRequestFilters): Promise<LeaveRequest[]> {
  const searchParams = new URLSearchParams();
  if (filters.status) searchParams.set("status", filters.status);
  if (filters.categoryId) searchParams.set("categoryId", filters.categoryId);
  if (filters.startDate) searchParams.set("startDate", filters.startDate);
  if (filters.endDate) searchParams.set("endDate", filters.endDate);

  const res = await fetch(`/api/leaves/requests?${searchParams.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch leave requests");
  }
  return res.json();
}

export function useLeaveRequests(filters: LeaveRequestFilters = {}) {
  return useQuery<LeaveRequest[]>({
    queryKey: queryKeys.leaves.requests(filters),
    queryFn: () => fetchLeaveRequests(filters),
    staleTime: 30_000,
  });
}

// ─── Leave Balance ───────────────────────────────────────────────────────────

async function fetchLeaveBalance(staffId: string, year: number): Promise<LeaveBalance[]> {
  const res = await fetch(`/api/leaves/balance?year=${year}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch leave balance");
  }
  return res.json();
}

export function useLeaveBalance(year?: number) {
  const { data: auth } = useAuth();
  const currentYear = year || new Date().getFullYear();

  return useQuery<LeaveBalance[]>({
    queryKey: queryKeys.leaves.balance(auth?.id || "", currentYear),
    queryFn: () => fetchLeaveBalance(auth?.id || "", currentYear),
    enabled: !!auth?.id,
    staleTime: 60_000,
  });
}

// ─── Create Leave Request ────────────────────────────────────────────────────

interface CreateLeaveRequestData {
  categoryId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason?: string;
}

async function createLeaveRequest(data: CreateLeaveRequestData): Promise<LeaveRequest> {
  const res = await fetch("/api/leaves/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create leave request");
  }
  return res.json();
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  const { data: auth } = useAuth();

  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.requests() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leaves.balance(auth?.id || "", new Date().getFullYear()),
      });
    },
  });
}

// ─── Update Leave Request (Approve/Reject) ───────────────────────────────────

interface UpdateLeaveRequestData {
  id: string;
  status: "APPROVED" | "REJECTED" | "CANCELLED";
  reviewNote?: string;
}

async function updateLeaveRequest({ id, ...data }: UpdateLeaveRequestData): Promise<LeaveRequest> {
  const res = await fetch(`/api/leaves/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update leave request");
  }
  return res.json();
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLeaveRequest,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.requests() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leaves.requestById(variables.id),
      });
    },
  });
}
