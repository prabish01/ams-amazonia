"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Users, Utensils, Pencil, Building2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";
import { AddRestaurantModal } from "@/components/restaurant/add-restaurant-modal";
import { useRestaurant } from "@/hooks/use-restaurants";
import { useStaff } from "@/hooks/use-staff";
import { Avatar } from "@/components/ui/avatar";
import { EmploymentBadge, RoleBadge } from "@/components/ui/badge";

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: restaurant, isLoading } = useRestaurant(id);
  const { data: allStaff } = useStaff();

  const restaurantStaff = allStaff?.filter((s) => s.restaurantId === id) ?? [];

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <SkeletonLine height={28} width="240px" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <p style={{ color: "#52525B", fontSize: "14px" }}>Restaurant not found.</p>
        <Button variant="secondary" size="sm" onClick={() => router.back()} style={{ marginTop: "16px" }}>
          Go back
        </Button>
      </div>
    );
  }

  const initial = restaurant.name.charAt(0).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "1px solid #27272A",
              borderRadius: "8px",
              padding: "6px 8px",
              cursor: "pointer",
              color: "#A1A1AA",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>
              {restaurant.name}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#52525B" }}>
              Restaurant details
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setEditModalOpen(true)}
          iconLeft={<Pencil size={14} />}
        >
          Edit
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader title="Overview" icon={<Building2 size={14} />} />
        <CardBody>
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Logo / Initial */}
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                style={{ width: 72, height: 72, borderRadius: "12px", objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "12px",
                  backgroundColor: "rgba(245,166,35,0.1)",
                  border: "1px solid rgba(245,166,35,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#F5A623",
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
            )}

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#E8E8E8" }}>
                  {restaurant.name}
                </h2>
                <Badge variant={restaurant.isActive ? "success" : "neutral"} size="sm" dot>
                  {restaurant.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {restaurant.cuisineType && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Utensils size={13} style={{ color: "#52525B", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#A1A1AA" }}>{restaurant.cuisineType}</span>
                  </div>
                )}
                {restaurant.address && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <MapPin size={13} style={{ color: "#52525B", marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#A1A1AA" }}>{restaurant.address}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Users size={13} style={{ color: "#52525B" }} />
                  <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                    {restaurant._count?.staff ?? restaurantStaff.length} staff members
                  </span>
                </div>
              </div>

              {restaurant.description && (
                <p style={{ margin: 0, fontSize: "13px", color: "#71717A", lineHeight: "20px" }}>
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid #1A1A1E",
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Created</p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#A1A1AA" }}>
                {format(new Date(restaurant.createdAt), "d MMM yyyy")}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Updated</p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#A1A1AA" }}>
                {format(new Date(restaurant.updatedAt), "d MMM yyyy")}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader
          title="Staff"
          subtitle={`${restaurantStaff.length} members`}
          icon={<Users size={14} />}
        />
        <CardBody padding={false}>
          {restaurantStaff.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#52525B" }}>No staff assigned to this restaurant.</p>
            </div>
          ) : (
            restaurantStaff.map((member, i) => (
              <div
                key={member.id}
                onClick={() => router.push(`/staff/${member.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 20px",
                  borderBottom: i < restaurantStaff.length - 1 ? "1px solid #1A1A1E" : undefined,
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1A1A1E"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <Avatar src={member.avatarUrl} name={member.name} size="sm" />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>{member.name}</p>
                  <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#52525B" }}>{member.email}</p>
                </div>
                <EmploymentBadge type={member.employmentType as "FULL_TIME" | "PART_TIME"} size="sm" />
                <RoleBadge role={member.role as "SUPER_ADMIN" | "ADMIN" | "STAFF"} size="sm" />
                <Badge variant={member.isActive ? "success" : "neutral"} size="sm" dot>
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <AddRestaurantModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        restaurant={restaurant}
      />
    </div>
  );
}
