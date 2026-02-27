"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type TrendDirection = "positive" | "negative" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: TrendDirection;
    value: string;
    label?: string;
  };
  color?: string;
  loading?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const trendConfig: Record<TrendDirection, { color: string; Icon: React.ComponentType<{ size?: number }> }> = {
  positive: { color: "#22C55E", Icon: TrendingUp },
  negative: { color: "#EF4444", Icon: TrendingDown },
  neutral: { color: "#52525B", Icon: Minus },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "#F5A623",
  loading = false,
  style,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#111113",
        border: "1px solid #27272A",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: onClick ? "pointer" : undefined,
        transition: "border-color 0.15s ease",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.borderColor = "#3F3F46"; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.borderColor = "#27272A"; } : undefined}
    >
      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          backgroundColor: color,
          opacity: 0.6,
          borderRadius: "12px 12px 0 0",
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </p>
        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              backgroundColor: color + "18",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div>
        {loading ? (
          <div
            style={{
              height: 32,
              width: "60%",
              borderRadius: "6px",
              background: "linear-gradient(90deg, #1A1A1E 25%, #222228 50%, #1A1A1E 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ) : (
          <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#E8E8E8", lineHeight: 1.1 }}>
            {value}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        {subtitle && (
          <p style={{ margin: 0, fontSize: "12px", color: "#52525B" }}>
            {subtitle}
          </p>
        )}
        {trend && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: trendConfig[trend.direction].color,
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {React.createElement(trendConfig[trend.direction].Icon, { size: 12 })}
            <span>{trend.value}</span>
            {trend.label && <span style={{ color: "#52525B" }}>{trend.label}</span>}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
