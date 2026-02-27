"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  DollarSign,
  User,
  Users,
  BarChart3,
} from "lucide-react";
import type { Role } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const staffNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/attendance", label: "Attend.", icon: Clock },
  { href: "/leaves", label: "Leaves", icon: CalendarDays },
  { href: "/reports", label: "Earnings", icon: DollarSign },
  { href: "/settings", label: "Profile", icon: User },
];

const adminNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/attendance", label: "Attend.", icon: Clock },
  { href: "/leaves", label: "Leaves", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

interface MobileNavProps {
  role: Role;
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const navItems = role === "STAFF" ? staffNav : adminNav;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        backgroundColor: "#111113",
        borderTop: "1px solid #27272A",
        display: "none",
        height: "60px",
        padding: "0 4px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      className="mobile-bottom-nav"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              textDecoration: "none",
              color: isActive ? "#F5A623" : "#52525B",
              padding: "8px 4px",
              borderRadius: "8px",
              transition: "color 0.15s ease",
              position: "relative",
            }}
          >
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "20px",
                  height: "2px",
                  backgroundColor: "#F5A623",
                  borderRadius: "0 0 2px 2px",
                }}
              />
            )}
            <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
            <span style={{ fontSize: "9px", fontWeight: isActive ? 600 : 400, letterSpacing: "0.02em" }}>
              {item.label}
            </span>
          </Link>
        );
      })}

      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}
