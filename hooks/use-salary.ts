"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { SalaryRate, EarningsSummary } from "@/types";

// ─── Salary Rates ────────────────────────────────────────────────────────────

interface FetchRatesParams {
  restaurantId?: string;
  staffId?: string;
}

async function fetchSalaryRates(params: FetchRatesParams): Promise<SalaryRate[]> {
  const searchParams = new URLSearchParams();
  if (params.restaurantId) searchParams.set("restaurantId", params.restaurantId);
  if (params.staffId) searchParams.set("staffId", params.staffId);

  const res = await fetch(`/api/salary/rates?${searchParams.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch salary rates");
  }
  return res.json();
}

export function useSalaryRates(restaurantId?: string, staffId?: string) {
  return useQuery<SalaryRate[]>({
    queryKey: queryKeys.salary.rates(restaurantId || ""),
    queryFn: () => fetchSalaryRates({ restaurantId, staffId }),
    staleTime: 60_000,
  });
}

// ─── Create/Update Salary Rate ───────────────────────────────────────────────

interface CreateSalaryRateData {
  hourlyRate: string;
  restaurantId: string;
  staffId?: string;
  categoryId?: string;
  effectiveTo?: string;
}

async function createSalaryRate(data: CreateSalaryRateData): Promise<SalaryRate> {
  const res = await fetch("/api/salary/rates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to set salary rate");
  }
  return res.json();
}

export function useCreateSalaryRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSalaryRate,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.salary.rates(variables.restaurantId),
      });
    },
  });
}

// ─── Earnings ────────────────────────────────────────────────────────────────

interface FetchEarningsParams {
  staffId: string;
  start: string;
  end: string;
}

async function fetchEarnings(params: FetchEarningsParams): Promise<EarningsSummary> {
  const res = await fetch("/api/reports/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "individual",
      staffId: params.staffId,
      start: params.start,
      end: params.end,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch earnings");
  }
  const data = await res.json();
  return data.rows?.[0];
}

export function useEarnings(staffId: string, start: string, end: string) {
  return useQuery<EarningsSummary>({
    queryKey: queryKeys.salary.earnings(staffId, start, end),
    queryFn: () => fetchEarnings({ staffId, start, end }),
    enabled: !!staffId && !!start && !!end,
    staleTime: 5 * 60 * 1000,
  });
}
