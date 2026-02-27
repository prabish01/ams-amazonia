"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { Role } from "@/types";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  restaurantId?: string | null;
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: User;
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0B",
        display: "flex",
      }}
    >
      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ flexShrink: 0 }}>
        <Sidebar user={user} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            display: "flex",
          }}
          className="mobile-overlay"
        >
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(2px)",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <Sidebar user={user} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar
          user={user}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          notificationCount={0}
        />
        <main
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            paddingBottom: "80px", // space for mobile nav
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav role={user.role} />

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
