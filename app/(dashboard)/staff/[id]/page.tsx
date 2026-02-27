"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar, Pencil, User } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge, EmploymentBadge, RoleBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { useStaffMember, useUpdateStaff } from "@/hooks/use-staff";
import { useRestaurants } from "@/hooks/use-restaurants";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [roleValue, setRoleValue] = useState<string>("");
  const [employmentValue, setEmploymentValue] = useState<string>("");
  const [restaurantValue, setRestaurantValue] = useState<string>("");
  const [activeValue, setActiveValue] = useState<string>("");

  const { data: member, isLoading } = useStaffMember(id);
  const { data: restaurants } = useRestaurants();
  const { mutate: updateStaff, isPending } = useUpdateStaff();

  // Sync local state when member loads
  React.useEffect(() => {
    if (member) {
      setRoleValue(member.role);
      setEmploymentValue(member.employmentType);
      setRestaurantValue(member.restaurantId ?? "");
      setActiveValue(member.isActive ? "true" : "false");
    }
  }, [member]);

  const handleSave = () => {
    updateStaff(
      {
        id,
        data: {
          role: roleValue as "ADMIN" | "STAFF",
          employmentType: employmentValue as "FULL_TIME" | "PART_TIME",
          restaurantId: restaurantValue || undefined,
          isActive: activeValue === "true",
        },
      },
      {
        onSuccess: () => {
          toast.success("Staff member updated");
          setEditing(false);
        },
        onError: () => toast.error("Failed to update staff member"),
      }
    );
  };

  const handleCancel = () => {
    if (member) {
      setRoleValue(member.role);
      setEmploymentValue(member.employmentType);
      setRestaurantValue(member.restaurantId ?? "");
      setActiveValue(member.isActive ? "true" : "false");
    }
    setEditing(false);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <SkeletonLine height={28} width="240px" />
        <SkeletonCard />
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <p style={{ color: "#52525B", fontSize: "14px" }}>Staff member not found.</p>
        <Button variant="secondary" size="sm" onClick={() => router.back()} style={{ marginTop: "16px" }}>
          Go back
        </Button>
      </div>
    );
  }

  const restaurantOptions = [
    { value: "", label: "No restaurant" },
    ...(restaurants?.map((r) => ({ value: r.id, label: r.name })) ?? []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "1px solid #27272A",
              borderRadius: "8px",
              padding: "6px 8px",
              cursor: "pointer",
              color: "#A1A1AA",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>
              {member.name}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#52525B" }}>
              Staff profile
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {editing ? (
            <>
              <Button variant="secondary" size="md" onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSave} loading={isPending}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setEditing(true)}
              iconLeft={<Pencil size={14} />}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader title="Profile" icon={<User size={14} />} />
        <CardBody>
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <Avatar src={member.avatarUrl} name={member.name} size="lg" />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Name + badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#E8E8E8" }}>
                  {member.name}
                </h2>
                <Badge variant={member.isActive ? "success" : "neutral"} size="sm" dot>
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Contact info */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Mail size={13} style={{ color: "#52525B", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#A1A1AA" }}>{member.email}</span>
                </div>
                {member.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Phone size={13} style={{ color: "#52525B", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#A1A1AA" }}>{member.phone}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={13} style={{ color: "#52525B", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                    Hired {format(new Date(member.hireDate), "d MMMM yyyy")}
                  </span>
                </div>
              </div>

              {/* Badges row (non-edit) */}
              {!editing && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <RoleBadge role={member.role as "SUPER_ADMIN" | "ADMIN" | "STAFF"} size="sm" />
                  <EmploymentBadge type={member.employmentType as "FULL_TIME" | "PART_TIME"} size="sm" />
                  {member.restaurant && (
                    <Badge variant="neutral" size="sm">
                      {member.restaurant.name}
                    </Badge>
                  )}
                  {member.staffCategory && (
                    <Badge variant="neutral" size="sm">
                      {member.staffCategory.name}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit form */}
          {editing && (
            <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid #1A1A1E",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "14px",
              }}
            >
              <Select
                label="Role"
                options={[
                  { value: "STAFF", label: "Staff" },
                  { value: "ADMIN", label: "Admin" },
                ]}
                value={roleValue}
                onChange={(e) => setRoleValue(e.target.value)}
              />
              <Select
                label="Employment Type"
                options={[
                  { value: "FULL_TIME", label: "Full Time" },
                  { value: "PART_TIME", label: "Part Time" },
                ]}
                value={employmentValue}
                onChange={(e) => setEmploymentValue(e.target.value)}
              />
              <Select
                label="Restaurant"
                options={restaurantOptions}
                value={restaurantValue}
                onChange={(e) => setRestaurantValue(e.target.value)}
              />
              <Select
                label="Status"
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
                value={activeValue}
                onChange={(e) => setActiveValue(e.target.value)}
              />
            </div>
          )}

          {/* Meta */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid #1A1A1E",
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Member Since</p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#A1A1AA" }}>
                {format(new Date(member.createdAt), "d MMM yyyy")}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Updated</p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#A1A1AA" }}>
                {format(new Date(member.updatedAt), "d MMM yyyy")}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
