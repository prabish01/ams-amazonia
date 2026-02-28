"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  containerStyle?: React.CSSProperties;
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  containerStyle,
  style,
  id,
  ...props
}: SelectProps) {
  const [focused, setFocused] = useState(false);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...containerStyle }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{ fontSize: "13px", fontWeight: 500, color: "#A1A1AA", display: "block" }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          id={selectId}
          {...props}
          style={{
            width: "100%",
            backgroundColor: "#111113",
            border: `1px solid ${error ? "#EF4444" : focused ? "#F5A623" : "#27272A"}`,
            borderRadius: "8px",
            padding: "0 36px 0 12px",
            height: "40px",
            color: props.value ? "#E8E8E8" : "#52525B",
            fontSize: "14px",
            lineHeight: "20px",
            outline: "none",
            appearance: "none",
            cursor: "pointer",
            transition: "border-color 0.15s ease",
            ...style,
          }}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              style={{ backgroundColor: "#1A1A1E", color: opt.disabled ? "#52525B" : "#E8E8E8" }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <span
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#52525B",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronDown size={16} />
        </span>
      </div>
      {error && (
        <span style={{ fontSize: "12px", color: "#EF4444", lineHeight: "16px" }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: "12px", color: "#52525B", lineHeight: "16px" }}>
          {hint}
        </span>
      )}
    </div>
  );
}
