"use client";

import React from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "#F5A623",
    color: "#0A0A0B",
    border: "1px solid transparent",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "#E8E8E8",
    border: "1px solid #3F3F46",
  },
  danger: {
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
    border: "1px solid transparent",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#A1A1AA",
    border: "1px solid transparent",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: "6px 12px",
    fontSize: "12px",
    lineHeight: "16px",
    borderRadius: "6px",
    gap: "6px",
    height: "30px",
  },
  md: {
    padding: "8px 16px",
    fontSize: "14px",
    lineHeight: "20px",
    borderRadius: "8px",
    gap: "8px",
    height: "38px",
  },
  lg: {
    padding: "12px 24px",
    fontSize: "16px",
    lineHeight: "24px",
    borderRadius: "10px",
    gap: "10px",
    height: "48px",
  },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 500,
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.5 : 1,
    transition: "opacity 0.15s ease, background-color 0.15s ease, transform 0.1s ease",
    outline: "none",
    flexShrink: 0,
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : undefined,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          const el = e.currentTarget;
          if (variant === "primary") el.style.backgroundColor = "#D4901E";
          if (variant === "secondary") el.style.backgroundColor = "#1A1A1E";
          if (variant === "danger") el.style.backgroundColor = "#DC2626";
          if (variant === "ghost") el.style.backgroundColor = "#1A1A1E";
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          const el = e.currentTarget;
          if (variant === "primary") el.style.backgroundColor = "#F5A623";
          if (variant === "secondary") el.style.backgroundColor = "transparent";
          if (variant === "danger") el.style.backgroundColor = "#EF4444";
          if (variant === "ghost") el.style.backgroundColor = "transparent";
        }
        props.onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        if (!isDisabled) e.currentTarget.style.transform = "scale(0.98)";
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        props.onMouseUp?.(e);
      }}
    >
      {loading ? (
        <Loader2
          size={size === "sm" ? 12 : size === "lg" ? 18 : 14}
          style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
        />
      ) : (
        iconLeft && <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{iconLeft}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && (
        <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{iconRight}</span>
      )}
    </button>
  );
}
