"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  ChevronRight,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Role } from "@/types";

function getBreadcrumbs(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg) => {
    const map: Record<string, string> = {
      dashboard: "Dashboard",
      workspace: "Workspace",
      restaurants: "Restaurants",
      staff: "Staff",
      attendance: "Attendance",
      leaves: "Leaves",
      manage: "Manage",
      salary: "Salary",
      reports: "Reports",
      settings: "Settings",
    };
    return map[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
  });
}

interface TopbarProps {
  user: {
    name: string;
    email: string;
    role: Role;
    avatarUrl?: string | null;
  };
  onMobileMenuOpen: () => void;
  notificationCount?: number;
}

export function Topbar({ user, onMobileMenuOpen, notificationCount = 0 }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "#111113",
        borderBottom: "1px solid #27272A",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "12px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Mobile: hamburger + logo */}
      <button
        onClick={onMobileMenuOpen}
        style={{
          display: "none",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#A1A1AA",
          padding: "6px",
          borderRadius: "6px",
        }}
        className="mobile-menu-btn"
      >
        <Menu size={20} />
      </button>

      {/* Desktop breadcrumbs */}
      <div
        className="breadcrumb-container"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flex: 1,
          minWidth: 0,
        }}
      >
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={14} style={{ color: "#27272A", flexShrink: 0 }} />}
            <span
              style={{
                fontSize: "13px",
                color: i === breadcrumbs.length - 1 ? "#E8E8E8" : "#52525B",
                fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Search */}
      <div
        className="search-container"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#1A1A1E",
          border: `1px solid ${searchFocused ? "#F5A623" : "#27272A"}`,
          borderRadius: "8px",
          padding: "0 12px",
          height: "36px",
          width: "220px",
          transition: "border-color 0.15s ease",
        }}
      >
        <Search size={14} style={{ color: "#52525B", flexShrink: 0 }} />
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search..."
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#E8E8E8",
            fontSize: "13px",
            width: "100%",
          }}
        />
      </div>

      {/* Notification bell */}
      <div ref={notifRef} style={{ position: "relative" }}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            backgroundColor: "transparent",
            border: "1px solid #27272A",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#A1A1AA",
            position: "relative",
            flexShrink: 0,
            transition: "background-color 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1A1A1E";
            e.currentTarget.style.color = "#E8E8E8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#A1A1AA";
          }}
        >
          <Bell size={16} />
          {notificationCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: "#EF4444",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid #111113",
              }}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "280px",
              backgroundColor: "#111113",
              border: "1px solid #27272A",
              borderRadius: "10px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              zIndex: 200,
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #27272A" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#E8E8E8" }}>
                Notifications
              </p>
            </div>
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#52525B" }}>No new notifications</p>
            </div>
          </div>
        )}
      </div>

      {/* User dropdown */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 8px 4px 4px",
            borderRadius: "8px",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1A1A1E"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <Avatar src={user.avatarUrl} name={user.name} size="sm" />
          <span
            className="user-name"
            style={{ fontSize: "13px", fontWeight: 500, color: "#E8E8E8", whiteSpace: "nowrap" }}
          >
            {user.name.split(" ")[0]}
          </span>
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "200px",
              backgroundColor: "#111113",
              border: "1px solid #27272A",
              borderRadius: "10px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              zIndex: 200,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #27272A" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#E8E8E8" }}>{user.name}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#52525B", marginTop: "2px" }}>{user.email}</p>
            </div>
            {[
              { icon: User, label: "Profile", href: "/settings" },
              { icon: Settings, label: "Settings", href: "/settings" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { router.push(item.href); setDropdownOpen(false); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#A1A1AA",
                  fontSize: "13px",
                  textAlign: "left",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1A1A1E";
                  e.currentTarget.style.color = "#E8E8E8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#A1A1AA";
                }}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid #27272A" }}>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#EF4444",
                  fontSize: "13px",
                  textAlign: "left",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .breadcrumb-container { display: none !important; }
          .search-container { display: none !important; }
          .user-name { display: none !important; }
        }
      `}</style>
    </header>
  );
}
