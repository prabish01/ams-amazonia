"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateRestaurant, useUpdateRestaurant } from "@/hooks/use-restaurants";
import type { Restaurant } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  address: z.string().optional(),
  cuisineType: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

const cuisineOptions = [
  { value: "", label: "Select cuisine type" },
  { value: "Cantonese", label: "Cantonese" },
  { value: "Sichuan", label: "Sichuan" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
  { value: "Western", label: "Western" },
  { value: "Fusion", label: "Fusion" },
  { value: "Dim Sum", label: "Dim Sum" },
  { value: "Seafood", label: "Seafood" },
  { value: "Steakhouse", label: "Steakhouse" },
  { value: "Cafe", label: "Cafe" },
  { value: "Bar & Grill", label: "Bar & Grill" },
  { value: "Other", label: "Other" },
];

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant?: Restaurant; // for editing
}

export function AddRestaurantModal({ isOpen, onClose, restaurant }: AddRestaurantModalProps) {
  const isEditing = !!restaurant;
  const { mutate: createRestaurant, isPending: creating } = useCreateRestaurant();
  const { mutate: updateRestaurant, isPending: updating } = useUpdateRestaurant();
  const isPending = creating || updating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: restaurant?.name || "",
      address: restaurant?.address || "",
      cuisineType: restaurant?.cuisineType || "",
      description: restaurant?.description || "",
      logoUrl: restaurant?.logoUrl || "",
    },
  });

  const cuisineValue = watch("cuisineType");

  const onSubmit = (data: FormData) => {
    const payload = {
      name: data.name,
      address: data.address || undefined,
      cuisineType: data.cuisineType || undefined,
      description: data.description || undefined,
      logoUrl: data.logoUrl || undefined,
    };

    if (isEditing) {
      updateRestaurant(
        { id: restaurant!.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Restaurant updated successfully");
            reset();
            onClose();
          },
          onError: () => toast.error("Failed to update restaurant"),
        },
      );
    } else {
      createRestaurant(payload, {
        onSuccess: () => {
          toast.success("Restaurant created successfully");
          reset();
          onClose();
        },
        onError: () => toast.error("Failed to create restaurant"),
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Edit Restaurant" : "Add Restaurant"}
      size="md"
      footer={
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button variant="secondary" size="md" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit(onSubmit)} loading={isPending}>
            {isEditing ? "Save Changes" : "Create Restaurant"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Input label="Restaurant Name *" placeholder="e.g. Amazonia Central" error={errors.name?.message} {...register("name")} />

        <Input label="Address" placeholder="e.g. Shop 203, IFC Mall, Central, HK" error={errors.address?.message} {...register("address")} />

        <Select label="Cuisine Type" options={cuisineOptions} value={cuisineValue} onChange={(e) => setValue("cuisineType", e.target.value)} error={errors.cuisineType?.message} />

        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#A1A1AA", marginBottom: "6px" }}>Description</label>
          <textarea
            {...register("description")}
            placeholder="Brief description of the restaurant..."
            style={{
              width: "100%",
              backgroundColor: "#0A0A0B",
              border: "1px solid #27272A",
              borderRadius: "8px",
              padding: "10px 12px",
              color: "#E8E8E8",
              fontSize: "14px",
              lineHeight: "20px",
              outline: "none",
              resize: "vertical",
              minHeight: "80px",
              transition: "border-color 0.15s ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#F5A623";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#27272A";
            }}
          />
        </div>

        <Input label="Logo URL" placeholder="https://example.com/logo.png" error={errors.logoUrl?.message} hint="Direct link to restaurant logo image" {...register("logoUrl")} />
      </form>
    </Modal>
  );
}
