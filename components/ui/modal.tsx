"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
}

const sizeWidths: Record<ModalSize, string> = {
  sm: "400px",
  md: "520px",
  lg: "680px",
  xl: "860px",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
  hideCloseButton = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        style={{
          backgroundColor: "#111113",
          border: "1px solid #27272A",
          borderRadius: "16px",
          width: "100%",
          maxWidth: sizeWidths[size],
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          animation: "scaleIn 0.15s ease",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
        }}
      >
        {(title || !hideCloseButton) && (
          <div
            style={{
              padding: "16px 20px",
              borderBottom: title ? "1px solid #27272A" : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            {title && (
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#E8E8E8" }}>
                {title}
              </h2>
            )}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#52525B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  borderRadius: "6px",
                  transition: "color 0.15s ease, background-color 0.15s ease",
                  marginLeft: "auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#E8E8E8";
                  e.currentTarget.style.backgroundColor = "#1A1A1E";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#52525B";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #27272A",
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
