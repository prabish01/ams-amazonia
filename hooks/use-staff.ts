"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/types";

// ─── List Staff ──────────────────────────────────────────────────────────────

async function fetchStaff(): Promise<User[]> {
  const res = await fetch("/api/staff");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch staff");
  }
  return res.json();
}

export function useStaff() {
  return useQuery<User[]>({
    queryKey: queryKeys.staff.all,
    queryFn: fetchStaff,
    staleTime: 60_000,
  });
}

// ─── Single Staff Member ─────────────────────────────────────────────────────

async function fetchStaffMember(id: string): Promise<User> {
  const res = await fetch(`/api/staff/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch staff member");
  }
  return res.json();
}

export function useStaffMember(id: string) {
  return useQuery<User>({
    queryKey: queryKeys.staff.byId(id),
    queryFn: () => fetchStaffMember(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ─── Create Staff ────────────────────────────────────────────────────────────

interface CreateStaffData {
  name: string;
  email: string;
  nickname?: string;
  phone?: string;
  hkid?: string;
  bankName?: string;
  bankCode?: string;
  bankAccountNumber?: string;
  role?: "ADMIN" | "STAFF";
  employmentType?: "FULL_TIME" | "PART_TIME";
  hireDate: string;
  restaurantId?: string;
  categoryId?: string;
  // Payroll fields
  staffNumber?: string | null;
  autopayDay?: number | null;
  monthlySalary?: number | null;
  foodAllowance?: number | null;
  incentive?: number | null;
  monthlyDeduction?: number | null;
  monthlyAdjustment?: number | null;
}

async function createStaff(data: CreateStaffData): Promise<User> {
  const res = await fetch("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create staff member");
  }
  return res.json();
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

// ─── Update Staff ────────────────────────────────────────────────────────────

interface UpdateStaffData {
  id: string;
  data: Partial<CreateStaffData> & { isActive?: boolean; avatarUrl?: string };
}

async function updateStaff({ id, data }: UpdateStaffData): Promise<User> {
  const res = await fetch(`/api/staff/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update staff member");
  }
  return res.json();
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaff,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.byId(variables.id),
      });
    },
  });
}

// ─── Delete Staff ────────────────────────────────────────────────────────────

async function deleteStaff(id: string): Promise<void> {
  const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete staff member");
  }
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
