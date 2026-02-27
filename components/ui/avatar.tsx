"use client";

import React, { useState } from "react";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<AvatarSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 9,
  md: 12,
  lg: 14,
  xl: 20,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    "#F5A623", "#3B82F6", "#22C55E", "#EF4444",
    "#8B5CF6", "#EC4899", "#06B6D4", "#F59E0B",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Avatar({ src, name, size = "md", style, onClick }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const px = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  const showInitials = !src || imgError;

  return (
    <div
      onClick={onClick}
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        cursor: onClick ? "pointer" : undefined,
        backgroundColor: showInitials ? bgColor + "22" : undefined,
        border: `1.5px solid ${showInitials ? bgColor + "44" : "#27272A"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {showInitials ? (
        <span
          style={{
            fontSize,
            fontWeight: 600,
            color: bgColor,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {initials}
        </span>
      ) : (
        <img
          src={src!}
          alt={name}
          onError={() => setImgError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  users: Array<{ name: string; avatarUrl?: string | null }>;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ users, max = 4, size = "sm" }: AvatarGroupProps) {
  const px = sizeMap[size];
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {visible.map((u, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -px * 0.35 }}>
          <Avatar
            src={u.avatarUrl}
            name={u.name}
            size={size}
            style={{ border: "2px solid #111113" }}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            width: px,
            height: px,
            borderRadius: "50%",
            backgroundColor: "#222228",
            border: "2px solid #111113",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: fontSizeMap[size] - 1,
            fontWeight: 600,
            color: "#A1A1AA",
            marginLeft: -px * 0.35,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
