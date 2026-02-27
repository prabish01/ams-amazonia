"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@/types";

async function fetchCurrentUser(): Promise<User> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch user");
  }
  return res.json();
}

export function useAuth() {
  return useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
