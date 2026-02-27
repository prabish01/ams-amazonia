"use client";

import React from "react";

const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #1A1A1E 25%, #222228 50%, #1A1A1E 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  borderRadius: "6px",
};

interface SkeletonLineProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  rounded?: boolean;
}

export function SkeletonLine({
  width = "100%",
  height = 14,
  style,
  rounded = false,
}: SkeletonLineProps) {
  return (
    <>
      <div
        style={{
          ...shimmerStyle,
          width,
          height,
          borderRadius: rounded ? "9999px" : "6px",
          ...style,
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
}

export function SkeletonCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: "#111113",
        border: "1px solid #27272A",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            ...shimmerStyle,
            width: 40,
            height: 40,
            borderRadius: "8px",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <SkeletonLine width="60%" height={14} />
          <SkeletonLine width="40%" height={12} />
        </div>
      </div>
      <SkeletonLine width="100%" height={12} />
      <SkeletonLine width="80%" height={12} />
      <SkeletonLine width="90%" height={12} />
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "12px",
          padding: "12px 16px",
          borderBottom: "1px solid #27272A",
          marginBottom: "4px",
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} height={12} width="70%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "12px",
            padding: "14px 16px",
            borderBottom: "1px solid #1A1A1E",
          }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonLine
              key={colIdx}
              height={14}
              width={colIdx === 0 ? "80%" : colIdx === cols - 1 ? "50%" : "65%"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
      }}
    />
  );
}
