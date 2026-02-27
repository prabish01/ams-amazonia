"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { Restaurant } from "@/types";

// ─── List Restaurants ────────────────────────────────────────────────────────

async function fetchRestaurants(): Promise<Restaurant[]> {
  const res = await fetch("/api/restaurants");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch restaurants");
  }
  return res.json();
}

export function useRestaurants() {
  return useQuery<Restaurant[]>({
    queryKey: queryKeys.restaurants.all,
    queryFn: fetchRestaurants,
    staleTime: 60_000,
  });
}

// ─── Single Restaurant ───────────────────────────────────────────────────────

async function fetchRestaurant(id: string): Promise<Restaurant> {
  const res = await fetch(`/api/restaurants/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch restaurant");
  }
  return res.json();
}

export function useRestaurant(id: string) {
  return useQuery<Restaurant>({
    queryKey: queryKeys.restaurants.byId(id),
    queryFn: () => fetchRestaurant(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ─── Create Restaurant ───────────────────────────────────────────────────────

interface CreateRestaurantData {
  name: string;
  address?: string;
  cuisineType?: string;
  description?: string;
  logoUrl?: string;
}

async function createRestaurant(data: CreateRestaurantData): Promise<Restaurant> {
  const res = await fetch("/api/restaurants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create restaurant");
  }
  return res.json();
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all });
    },
  });
}

// ─── Update Restaurant ───────────────────────────────────────────────────────

interface UpdateRestaurantData {
  id: string;
  data: Partial<CreateRestaurantData> & { isActive?: boolean };
}

async function updateRestaurant({ id, data }: UpdateRestaurantData): Promise<Restaurant> {
  const res = await fetch(`/api/restaurants/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update restaurant");
  }
  return res.json();
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRestaurant,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.restaurants.byId(variables.id),
      });
    },
  });
}

// ─── Delete Restaurant ───────────────────────────────────────────────────────

async function deleteRestaurant(id: string): Promise<void> {
  const res = await fetch(`/api/restaurants/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete restaurant");
  }
}

export function useDeleteRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all });
    },
  });
}
