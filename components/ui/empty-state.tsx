"use client";

import React from "react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "ghost";
    icon?: React.ReactNode;
  };
  style?: React.CSSProperties;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  style,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: compact ? "32px 16px" : "60px 24px",
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            width: compact ? 44 : 60,
            height: compact ? 44 : 60,
            borderRadius: "14px",
            backgroundColor: "rgba(245, 166, 35, 0.08)",
            border: "1px solid rgba(245, 166, 35, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            color: "#F5A623",
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          margin: 0,
          fontSize: compact ? "14px" : "16px",
          fontWeight: 600,
          color: "#E8E8E8",
          marginBottom: description ? "6px" : "0",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#52525B",
            lineHeight: "18px",
            maxWidth: "320px",
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: "20px" }}>
          <Button
            variant={action.variant || "primary"}
            size="sm"
            onClick={action.onClick}
            iconLeft={action.icon}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
