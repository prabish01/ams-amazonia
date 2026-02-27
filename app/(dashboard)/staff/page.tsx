"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Search, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge, EmploymentBadge, RoleBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { AddStaffModal } from "@/components/staff/add-staff-modal";
import { useStaff } from "@/hooks/use-staff";

const employmentOptions = [
  { value: "", label: "All Types" },
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
];

const roleOptions = [
  { value: "", label: "All Roles" },
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admin" },
];

export default function StaffPage() {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data: staff, isLoading } = useStaff();

  const filtered = staff?.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchEmployment = !employmentFilter || s.employmentType === employmentFilter;
    const matchRole = !roleFilter || s.role === roleFilter;
    return matchSearch && matchEmployment && matchRole;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>Staff</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
            {staff?.length || 0} team members
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setAddModalOpen(true)}
          iconLeft={<Plus size={16} />}
        >
          Add Staff
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            iconPrefix={<Search size={14} />}
          />
        </div>
        <Select
          options={employmentOptions}
          value={employmentFilter}
          onChange={(e) => setEmploymentFilter(e.target.value)}
          containerStyle={{ minWidth: "130px" }}
        />
        <Select
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          containerStyle={{ minWidth: "110px" }}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader
          title="All Staff"
          subtitle={`${filtered?.length || 0} members`}
          icon={<Users size={14} />}
        />
        <CardBody padding={false}>
          {isLoading ? (
            <div style={{ padding: "16px" }}>
              <SkeletonTable rows={5} cols={5} />
            </div>
          ) : !filtered?.length ? (
            <EmptyState
              icon={<Users size={22} />}
              title={search ? "No staff found" : "No staff members yet"}
              description={search ? "Try a different search term." : "Add your first staff member to get started."}
              action={!search ? { label: "Add Staff", onClick: () => setAddModalOpen(true), icon: <Plus size={14} /> } : undefined}
              compact
            />
          ) : (
            <>
              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.5fr 1.2fr 1.2fr 1fr 80px 32px",
                  padding: "10px 20px",
                  borderBottom: "1px solid #27272A",
                  gap: "12px",
                }}
              >
                {["Staff Member", "Employment", "Role", "Hire Date", "Status", ""].map((h) => (
                  <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </span>
                ))}
              </div>

              {filtered.map((member, i) => (
                <div
                  key={member.id}
                  onClick={() => router.push(`/staff/${member.id}`)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.5fr 1.2fr 1.2fr 1fr 80px 32px",
                    padding: "14px 20px",
                    borderBottom: i < filtered.length - 1 ? "1px solid #1A1A1E" : undefined,
                    gap: "12px",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1A1A1E"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {/* Staff */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar src={member.avatarUrl} name={member.name} size="sm" />
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>
                        {member.name}
                      </p>
                      <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#52525B" }}>
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <EmploymentBadge type={member.employmentType as "FULL_TIME" | "PART_TIME"} size="sm" />

                  <RoleBadge role={member.role as "SUPER_ADMIN" | "ADMIN" | "STAFF"} size="sm" />

                  <span style={{ fontSize: "12px", color: "#A1A1AA" }}>
                    {format(new Date(member.hireDate), "d MMM yyyy")}
                  </span>

                  <Badge variant={member.isActive ? "success" : "neutral"} size="sm" dot>
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>

                  <ChevronRight size={14} style={{ color: "#52525B" }} />
                </div>
              ))}
            </>
          )}
        </CardBody>
      </Card>

      <AddStaffModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}
