"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, MapPin, Users, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { AddRestaurantModal } from "@/components/restaurant/add-restaurant-modal";
import { useAuth } from "@/hooks/use-auth";
import { useRestaurants, useRestaurant } from "@/hooks/use-restaurants";

// ─── SUPER_ADMIN view: full grid ─────────────────────────────────────────────

function SuperAdminView() {
  const { data: restaurants, isLoading } = useRestaurants();
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>
            Restaurants
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
            Manage all Amazonia restaurant locations
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setAddModalOpen(true)}
          iconLeft={<Plus size={16} />}
        >
          Add Restaurant
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total", value: restaurants?.length || 0, color: "#F5A623" },
          { label: "Active", value: restaurants?.filter((r) => r.isActive).length || 0, color: "#22C55E" },
          { label: "Staff", value: restaurants?.reduce((sum, r) => sum + (r._count?.staff || 0), 0) || 0, color: "#3B82F6" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: "#111113",
              border: "1px solid #27272A",
              borderRadius: "10px",
              padding: "12px 20px",
              minWidth: "100px",
            }}
          >
            <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#52525B" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : !restaurants?.length ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="No restaurants yet"
          description="Add your first restaurant location to get started with the Amazonia HR system."
          action={{ label: "Add Restaurant", onClick: () => setAddModalOpen(true), icon: <Plus size={14} /> }}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}

      <AddRestaurantModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
}

// ─── ADMIN view: assigned restaurant ─────────────────────────────────────────

function AdminView({ restaurantId }: { restaurantId: string }) {
  const { data: restaurant, isLoading } = useRestaurant(restaurantId);
  const router = useRouter();

  if (isLoading) {
    return <SkeletonCard />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>Restaurant</h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>Your assigned location</p>
      </div>

      {!restaurant ? (
        <Card>
          <CardBody>
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Building2 size={32} style={{ color: "#27272A", marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: "14px", color: "#52525B" }}>
                No restaurant assigned to your account yet.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              {restaurant.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  style={{ width: 64, height: 64, borderRadius: "12px", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "12px",
                    backgroundColor: "rgba(245,166,35,0.1)",
                    border: "1px solid rgba(245,166,35,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#F5A623",
                    flexShrink: 0,
                  }}
                >
                  {restaurant.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#E8E8E8" }}>
                    {restaurant.name}
                  </h2>
                  <Badge variant={restaurant.isActive ? "success" : "neutral"} size="sm" dot>
                    {restaurant.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {restaurant.cuisineType && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Utensils size={13} style={{ color: "#52525B" }} />
                      <span style={{ fontSize: "13px", color: "#A1A1AA" }}>{restaurant.cuisineType}</span>
                    </div>
                  )}
                  {restaurant.address && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <MapPin size={13} style={{ color: "#52525B", marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: "#A1A1AA" }}>{restaurant.address}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Users size={13} style={{ color: "#52525B" }} />
                    <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                      {restaurant._count?.staff ?? 0} staff members
                    </span>
                  </div>
                </div>

                {restaurant.description && (
                  <p style={{ margin: 0, fontSize: "13px", color: "#71717A", lineHeight: "20px" }}>
                    {restaurant.description}
                  </p>
                )}

                <div style={{ marginTop: 4 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const { data: auth, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ height: 22, width: 180, backgroundColor: "#27272A", borderRadius: 6 }} />
        <SkeletonCard />
      </div>
    );
  }

  if (auth?.role === "SUPER_ADMIN") {
    return <SuperAdminView />;
  }

  return <AdminView restaurantId={auth?.restaurantId ?? ""} />;
}
