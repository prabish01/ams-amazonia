"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

async function fetchDashboardStats() {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

export function useDashboardStats() {
  const { data: auth } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    enabled: !!auth?.id && ["ADMIN", "SUPER_ADMIN"].includes(auth.role || ""),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
