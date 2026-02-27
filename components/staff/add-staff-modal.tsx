"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateStaff } from "@/hooks/use-staff";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "STAFF"]),
  employmentType: z.enum(["FULL_TIME", "PART_TIME"]),
  hireDate: z.string().min(1, "Hire date is required"),
  restaurantId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
}

export function AddStaffModal({ isOpen, onClose, restaurantId }: AddStaffModalProps) {
  const { mutate: createStaff, isPending } = useCreateStaff();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "STAFF",
      employmentType: "FULL_TIME",
      hireDate: format(new Date(), "yyyy-MM-dd"),
      restaurantId: restaurantId,
    },
  });

  const onSubmit = (data: FormData) => {
    createStaff(
      {
        ...data,
        restaurantId: data.restaurantId || restaurantId,
      },
      {
        onSuccess: () => {
          toast.success("Staff member added successfully");
          reset();
          onClose();
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to add staff member");
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Staff Member"
      size="md"
      footer={
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isPending}>
            Add Staff Member
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Input
            label="Full Name *"
            placeholder="e.g. Chan Tai Man"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email *"
            type="email"
            placeholder="staff@amazonia.hk"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Input
            label="Phone"
            type="tel"
            placeholder="+852 9XXX XXXX"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label="Hire Date *"
            type="date"
            error={errors.hireDate?.message}
            {...register("hireDate")}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                label="Role *"
                options={[
                  { value: "STAFF", label: "Staff" },
                  { value: "ADMIN", label: "Admin" },
                ]}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                error={errors.role?.message}
              />
            )}
          />
          <Controller
            name="employmentType"
            control={control}
            render={({ field }) => (
              <Select
                label="Employment Type *"
                options={[
                  { value: "FULL_TIME", label: "Full Time" },
                  { value: "PART_TIME", label: "Part Time" },
                ]}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                error={errors.employmentType?.message}
              />
            )}
          />
        </div>

        {/* Info box */}
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "rgba(245,166,35,0.06)",
            border: "1px solid rgba(245,166,35,0.15)",
            borderRadius: "8px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#A1A1AA", lineHeight: "18px" }}>
            An invitation email will be sent to the staff member to set up their account password.
            Their initial role and restaurant assignment can be updated afterwards.
          </p>
        </div>
      </form>
    </Modal>
  );
}
