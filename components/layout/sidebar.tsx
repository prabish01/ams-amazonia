"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Role } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  roles: Role[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "STAFF"] },
  { href: "/restaurants", label: "Restaurants", icon: Utensils, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/staff", label: "Staff", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/attendance", label: "Attendance", icon: Clock, roles: ["SUPER_ADMIN", "ADMIN", "STAFF"] },
  { href: "/leaves", label: "Leaves", icon: CalendarDays, roles: ["SUPER_ADMIN", "ADMIN", "STAFF"] },
  { href: "/salary", label: "Salary", icon: DollarSign, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN", "STAFF"] },
];

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: Role;
    avatarUrl?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setLoggingOut(false);
    }
  };

  const roleLabel = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    STAFF: "Staff",
  }[user.role];

  return (
    <aside
      style={{
        width: collapsed ? "64px" : "220px",
        minWidth: collapsed ? "64px" : "220px",
        backgroundColor: "#111113",
        borderRight: "1px solid #27272A",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        transition: "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 16px",
          borderBottom: "1px solid #27272A",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          flexShrink: 0,
          minHeight: "64px",
        }}
      >
        {!collapsed && (
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#F5A623", letterSpacing: "0.05em" }}>
                A
              </span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#E8E8E8", letterSpacing: "0.05em" }}>
                MAZONIA
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "10px", color: "#52525B", letterSpacing: "0.1em", fontWeight: 500 }}>
              HR MANAGEMENT
            </p>
          </div>
        )}
        {collapsed && (
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#F5A623" }}>A</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: 24,
            height: 24,
            borderRadius: "6px",
            backgroundColor: "transparent",
            border: "1px solid #27272A",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#52525B",
            flexShrink: 0,
            transition: "background-color 0.15s ease, color 0.15s ease",
            ...(collapsed ? { position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)" } : {}),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1A1A1E";
            e.currentTarget.style.color = "#E8E8E8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#52525B";
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto", overflowX: "hidden" }}>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: collapsed ? "10px 0" : "9px 14px",
                margin: "2px 8px",
                borderRadius: "8px",
                textDecoration: "none",
                color: isActive ? "#F5A623" : "#A1A1AA",
                backgroundColor: isActive ? "rgba(245, 166, 35, 0.08)" : "transparent",
                borderLeft: isActive ? "2px solid #F5A623" : "2px solid transparent",
                transition: "background-color 0.15s ease, color 0.15s ease",
                justifyContent: collapsed ? "center" : undefined,
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#1A1A1E";
                  e.currentTarget.style.color = "#E8E8E8";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#A1A1AA";
                }
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {!collapsed && (
                <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div
        style={{
          padding: collapsed ? "12px 0" : "12px",
          borderTop: "1px solid #27272A",
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                background: "transparent",
                border: "none",
                cursor: loggingOut ? "not-allowed" : "pointer",
                color: "#52525B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px",
              }}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#1A1A1E",
              borderRadius: "8px",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#E8E8E8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </p>
              <p style={{ margin: 0, fontSize: "10px", color: "#F5A623", fontWeight: 500 }}>
                {roleLabel}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out"
              style={{
                background: "transparent",
                border: "none",
                cursor: loggingOut ? "not-allowed" : "pointer",
                color: "#52525B",
                display: "flex",
                alignItems: "center",
                padding: "4px",
                borderRadius: "4px",
                transition: "color 0.15s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#52525B"; }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
