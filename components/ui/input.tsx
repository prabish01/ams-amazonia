"use client";

import React, { useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  iconPrefix?: React.ReactNode;
  iconSuffix?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

export function Input({
  label,
  error,
  hint,
  iconPrefix,
  iconSuffix,
  containerStyle,
  style,
  id,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#111113",
    border: `1px solid ${error ? "#EF4444" : focused ? "#F5A623" : "#27272A"}`,
    borderRadius: "8px",
    padding: "0 12px",
    height: "40px",
    transition: "border-color 0.15s ease",
    gap: "8px",
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#E8E8E8",
    fontSize: "14px",
    lineHeight: "20px",
    width: "100%",
    ...style,
  };

  const iconStyle: React.CSSProperties = {
    color: error ? "#EF4444" : focused ? "#F5A623" : "#52525B",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    transition: "color 0.15s ease",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...containerStyle }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#A1A1AA",
            display: "block",
          }}
        >
          {label}
        </label>
      )}
      <div style={wrapperStyle}>
        {iconPrefix && <span style={iconStyle}>{iconPrefix}</span>}
        <input
          id={inputId}
          {...props}
          style={inputStyle}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
        {iconSuffix && <span style={iconStyle}>{iconSuffix}</span>}
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

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: React.CSSProperties;
}

export function Textarea({
  label,
  error,
  hint,
  containerStyle,
  style,
  id,
  ...props
}: TextareaProps) {
  const [focused, setFocused] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...containerStyle }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: "13px", fontWeight: 500, color: "#A1A1AA", display: "block" }}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...props}
        style={{
          backgroundColor: "#111113",
          border: `1px solid ${error ? "#EF4444" : focused ? "#F5A623" : "#27272A"}`,
          borderRadius: "8px",
          padding: "10px 12px",
          color: "#E8E8E8",
          fontSize: "14px",
          lineHeight: "20px",
          outline: "none",
          resize: "vertical",
          minHeight: "80px",
          width: "100%",
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
      />
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
