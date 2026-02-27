"use client";

import React from "react";
import type { LeaveStatus } from "@/types";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: "sm" | "md";
  dot?: boolean;
  style?: React.CSSProperties;
}

const variantConfig: Record<BadgeVariant, { bg: string; color: string; dotColor: string }> = {
  success: { bg: "rgba(34, 197, 94, 0.12)", color: "#22C55E", dotColor: "#22C55E" },
  warning: { bg: "rgba(234, 179, 8, 0.12)", color: "#EAB308", dotColor: "#EAB308" },
  danger: { bg: "rgba(239, 68, 68, 0.12)", color: "#EF4444", dotColor: "#EF4444" },
  info: { bg: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", dotColor: "#3B82F6" },
  neutral: { bg: "rgba(82, 82, 91, 0.2)", color: "#A1A1AA", dotColor: "#52525B" },
  accent: { bg: "rgba(245, 166, 35, 0.12)", color: "#F5A623", dotColor: "#F5A623" },
};

export function Badge({ variant = "neutral", children, size = "md", dot = false, style }: BadgeProps) {
  const config = variantConfig[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        backgroundColor: config.bg,
        color: config.color,
        borderRadius: "6px",
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        fontSize: size === "sm" ? "11px" : "12px",
        fontWeight: 500,
        lineHeight: "16px",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: config.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

const leaveStatusConfig: Record<LeaveStatus, { variant: BadgeVariant; label: string }> = {
  PENDING: { variant: "warning", label: "Pending" },
  APPROVED: { variant: "success", label: "Approved" },
  REJECTED: { variant: "danger", label: "Rejected" },
  CANCELLED: { variant: "neutral", label: "Cancelled" },
};

interface StatusBadgeProps {
  status: LeaveStatus;
  size?: "sm" | "md";
  dot?: boolean;
}

export function StatusBadge({ status, size, dot = true }: StatusBadgeProps) {
  const config = leaveStatusConfig[status];
  return (
    <Badge variant={config.variant} size={size} dot={dot}>
      {config.label}
    </Badge>
  );
}

interface EmploymentBadgeProps {
  type: "FULL_TIME" | "PART_TIME";
  size?: "sm" | "md";
}

export function EmploymentBadge({ type, size }: EmploymentBadgeProps) {
  return (
    <Badge variant={type === "FULL_TIME" ? "info" : "accent"} size={size}>
      {type === "FULL_TIME" ? "Full Time" : "Part Time"}
    </Badge>
  );
}

interface RoleBadgeProps {
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
  size?: "sm" | "md";
}

export function RoleBadge({ role, size }: RoleBadgeProps) {
  const config = {
    SUPER_ADMIN: { variant: "accent" as BadgeVariant, label: "Super Admin" },
    ADMIN: { variant: "info" as BadgeVariant, label: "Admin" },
    STAFF: { variant: "neutral" as BadgeVariant, label: "Staff" },
  };
  const c = config[role];
  return <Badge variant={c.variant} size={size}>{c.label}</Badge>;
}
