"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Users, ChevronRight, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Restaurant } from "@/types";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const initial = restaurant.name.charAt(0).toUpperCase();

  return (
    <div
      style={{
        backgroundColor: "#111113",
        border: "1px solid #27272A",
        borderRadius: "14px",
        overflow: "hidden",
        transition: "border-color 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3F3F46"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#27272A"; }}
    >
      {/* Card top accent */}
      <div style={{ height: "3px", backgroundColor: "#F5A623", opacity: 0.6 }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
          {restaurant.logoUrl ? (
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name}
              style={{ width: 48, height: 48, borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "10px",
                backgroundColor: "rgba(245,166,35,0.1)",
                border: "1px solid rgba(245,166,35,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 700,
                color: "#F5A623",
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#E8E8E8" }}>
                {restaurant.name}
              </h3>
              <Badge variant={restaurant.isActive ? "success" : "neutral"} size="sm" dot>
                {restaurant.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {restaurant.cuisineType && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <Utensils size={11} style={{ color: "#52525B" }} />
                <span style={{ fontSize: "12px", color: "#52525B" }}>{restaurant.cuisineType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {restaurant.address && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <MapPin size={13} style={{ color: "#52525B", marginTop: "1px", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: "#A1A1AA", lineHeight: "18px" }}>
                {restaurant.address}
              </span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={13} style={{ color: "#52525B" }} />
            <span style={{ fontSize: "12px", color: "#A1A1AA" }}>
              {restaurant._count?.staff || 0} staff members
            </span>
          </div>
        </div>

        {restaurant.description && (
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "12px",
              color: "#52525B",
              lineHeight: "18px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {restaurant.description}
          </p>
        )}

        {/* Action */}
        <Link href={`/restaurants/${restaurant.id}`} style={{ textDecoration: "none" }}>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            iconRight={<ChevronRight size={14} />}
          >
            Manage Restaurant
          </Button>
        </Link>
      </div>
    </div>
  );
}
