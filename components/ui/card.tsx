"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, style, className, onClick, hoverable }: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        backgroundColor: "#111113",
        border: "1px solid #27272A",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: hoverable ? "pointer" : undefined,
        transition: hoverable ? "border-color 0.15s ease, transform 0.15s ease" : undefined,
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.borderColor = "#3F3F46";
        e.currentTarget.style.transform = "translateY(-1px)";
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.borderColor = "#27272A";
        e.currentTarget.style.transform = "translateY(0)";
      } : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action, style, icon }: CardHeaderProps) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid #27272A",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        {icon && (
          <span style={{ color: "#F5A623", flexShrink: 0, display: "flex", alignItems: "center" }}>
            {icon}
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              color: "#E8E8E8",
              lineHeight: "20px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: 0, fontSize: "12px", color: "#52525B", lineHeight: "16px", marginTop: "2px" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: boolean;
}

export function CardBody({ children, style, padding = true }: CardBodyProps) {
  return (
    <div style={{ padding: padding ? "16px 20px" : undefined, ...style }}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return (
    <div
      style={{
        padding: "12px 20px",
        borderTop: "1px solid #27272A",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
