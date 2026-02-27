"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Plus, Edit2, Trash2, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useLeaveCategories, useCreateLeaveRequest } from "@/hooks/use-leaves";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").toUpperCase(),
  description: z.string().optional(),
  maxDaysPerYear: z.number().min(0).optional(),
  isPaid: z.boolean(),
  isStatutory: z.boolean(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: auth, isLoading } = useAuth();
  const { data: categories } = useLeaveCategories();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const {
    register: profileReg,
    handleSubmit: profileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSaving },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: auth?.name || "",
      phone: auth?.phone || "",
      avatarUrl: auth?.avatarUrl || "",
    },
  });

  const {
    register: catReg,
    handleSubmit: catSubmit,
    formState: { errors: catErrors },
    reset: catReset,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) as any, defaultValues: { isPaid: true, isStatutory: false, name: "", code: "" } });

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const { mutate: createCategory, isPending: creatingCategory } = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const res = await fetch("/api/leaves/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Leave category created");
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.categories });
      setCategoryModalOpen(false);
      catReset();
    },
    onError: () => toast.error("Failed to create leave category"),
  });

  const isSuperAdmin = auth?.role === "SUPER_ADMIN";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>Settings</h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
          Manage your profile and system settings
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader title="Profile" subtitle="Update your personal information" icon={<User size={14} />} />
        <CardBody>
          {/* Avatar preview */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <Avatar src={auth?.avatarUrl} name={auth?.name || "?"} size="xl" />
            <div>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#E8E8E8" }}>{auth?.name}</p>
              <p style={{ margin: "2px 0 4px", fontSize: "12px", color: "#52525B" }}>{auth?.email}</p>
              <Badge variant={auth?.role === "SUPER_ADMIN" ? "accent" : auth?.role === "ADMIN" ? "info" : "neutral"} size="sm">
                {auth?.role === "SUPER_ADMIN" ? "Super Admin" : auth?.role === "ADMIN" ? "Admin" : "Staff"}
              </Badge>
            </div>
          </div>

          <form
            onSubmit={profileSubmit((d) => saveProfile(d))}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Input
                label="Full Name *"
                error={profileErrors.name?.message}
                {...profileReg("name")}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+852 9XXX XXXX"
                error={profileErrors.phone?.message}
                {...profileReg("phone")}
              />
            </div>
            <Input
              label="Avatar URL"
              placeholder="https://example.com/avatar.jpg"
              error={profileErrors.avatarUrl?.message}
              hint="Public URL to your profile photo"
              {...profileReg("avatarUrl")}
            />
            <div>
              <Button type="submit" variant="primary" size="md" loading={savingProfile || profileSaving}>
                Save Profile
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Leave Categories — SuperAdmin only */}
      {isSuperAdmin && (
        <Card>
          <CardHeader
            title="Leave Categories"
            subtitle="Manage statutory and custom leave types"
            icon={<ShieldCheck size={14} />}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCategoryModalOpen(true)}
                iconLeft={<Plus size={14} />}
              >
                Add Category
              </Button>
            }
          />
          <CardBody padding={false}>
            {categories?.length ? (
              categories.map((cat, i) => (
                <div
                  key={cat.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    borderBottom: i < categories.length - 1 ? "1px solid #1A1A1E" : undefined,
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>
                        {cat.name}
                      </p>
                      <Badge variant="neutral" size="sm">{cat.code}</Badge>
                      {cat.isStatutory && <Badge variant="accent" size="sm">Statutory</Badge>}
                      {!cat.isPaid && <Badge variant="neutral" size="sm">Unpaid</Badge>}
                      {!cat.isActive && <Badge variant="danger" size="sm">Inactive</Badge>}
                    </div>
                    {cat.description && (
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#52525B" }}>{cat.description}</p>
                    )}
                  </div>
                  {cat.maxDaysPerYear && (
                    <span style={{ fontSize: "12px", color: "#A1A1AA", flexShrink: 0 }}>
                      {cat.maxDaysPerYear} days/year
                    </span>
                  )}
                  <button
                    style={{
                      background: "transparent",
                      border: "1px solid #27272A",
                      borderRadius: "6px",
                      padding: "5px 8px",
                      cursor: "pointer",
                      color: "#52525B",
                      display: "flex",
                      alignItems: "center",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5A623"; e.currentTarget.style.color = "#F5A623"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#27272A"; e.currentTarget.style.color = "#52525B"; }}
                    title="Edit"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<Plus size={20} />}
                title="No leave categories"
                description="Add statutory and custom leave categories."
                compact
                action={{ label: "Add Category", onClick: () => setCategoryModalOpen(true) }}
              />
            )}
          </CardBody>
        </Card>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => { setCategoryModalOpen(false); catReset(); }}
        title="Add Leave Category"
        size="sm"
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={() => { setCategoryModalOpen(false); catReset(); }} disabled={creatingCategory}>
              Cancel
            </Button>
            <Button variant="primary" onClick={catSubmit((d: CategoryForm) => createCategory(d))} loading={creatingCategory}>
              Create Category
            </Button>
          </div>
        }
      >
        <form style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input
              label="Name *"
              placeholder="Annual Leave"
              error={catErrors.name?.message}
              {...catReg("name")}
            />
            <Input
              label="Code *"
              placeholder="ANNUAL"
              error={catErrors.code?.message}
              {...catReg("code")}
            />
          </div>
          <Input
            label="Description"
            placeholder="Brief description..."
            {...catReg("description")}
          />
          <Input
            label="Max Days Per Year"
            type="number"
            placeholder="14"
            {...catReg("maxDaysPerYear", { valueAsNumber: true })}
          />
          <div style={{ display: "flex", gap: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" {...catReg("isPaid")} style={{ accentColor: "#F5A623" }} />
              <span style={{ fontSize: "13px", color: "#A1A1AA" }}>Paid leave</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" {...catReg("isStatutory")} style={{ accentColor: "#F5A623" }} />
              <span style={{ fontSize: "13px", color: "#A1A1AA" }}>Statutory</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
