"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { differenceInCalendarDays, parseISO, addDays, format } from "date-fns";
import { CalendarDays, Info, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeaveCategories, useCreateLeaveRequest } from "@/hooks/use-leaves";

const schema = z.object({
  categoryId: z.string().min(1, "Please select a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return parseISO(data.endDate) >= parseISO(data.startDate);
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

type FormData = z.infer<typeof schema>;

const hkLeaveInfo: Record<string, string> = {
  ANNUAL: "Annual leave entitlement increases with years of service under Hong Kong Employment Ordinance.",
  SICK: "Paid sick leave after 1 month of employment. Up to 4 days in any rolling 12-month period initially.",
  MATERNITY: "14 weeks of maternity leave (80% pay) under Hong Kong law.",
  PATERNITY: "5 days of paternity leave (80% pay) under Hong Kong law.",
  STATUTORY: "Statutory holidays: 13 days per year under Hong Kong Employment Ordinance.",
};

interface RequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestLeaveModal({ isOpen, onClose }: RequestLeaveModalProps) {
  const { data: categories = [], isLoading: categoriesLoading } = useLeaveCategories();
  const { mutate: createRequest, isPending } = useCreateLeaveRequest();
  const [daysCount, setDaysCount] = useState<number>(0);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const defaultEnd = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: today,
      endDate: today,
    },
  });

  const watchStart = watch("startDate");
  const watchEnd = watch("endDate");
  const watchCategory = watch("categoryId");

  useEffect(() => {
    if (watchStart && watchEnd) {
      const diff = differenceInCalendarDays(parseISO(watchEnd), parseISO(watchStart)) + 1;
      setDaysCount(diff > 0 ? diff : 0);
    }
  }, [watchStart, watchEnd]);

  useEffect(() => {
    if (watchCategory && categories.length) {
      const cat = categories.find((c) => c.id === watchCategory);
      if (cat?.code && hkLeaveInfo[cat.code]) {
        setSelectedCategoryInfo(hkLeaveInfo[cat.code]);
      } else {
        setSelectedCategoryInfo(null);
      }
    }
  }, [watchCategory, categories]);

  const onSubmit = (data: FormData) => {
    createRequest(
      {
        categoryId: data.categoryId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        daysRequested: daysCount,
      },
      {
        onSuccess: () => {
          toast.success("Leave request submitted successfully");
          reset();
          onClose();
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to submit leave request");
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const categoryOptions = [
    { value: "", label: "Select leave type" },
    ...categories.map((c) => ({ value: c.id, label: `${c.name}${c.isStatutory ? " (Statutory)" : ""}` })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Leave"
      size="md"
      footer={
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isPending}>
            Submit Request
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Category */}
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select
              label="Leave Type *"
              options={categoryOptions}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              error={errors.categoryId?.message}
            />
          )}
        />

        {/* HK Info */}
        {selectedCategoryInfo && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "10px 12px",
              backgroundColor: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "8px",
            }}
          >
            <Info size={14} style={{ color: "#3B82F6", flexShrink: 0, marginTop: "1px" }} />
            <p style={{ margin: 0, fontSize: "12px", color: "#A1A1AA", lineHeight: "18px" }}>
              {selectedCategoryInfo}
            </p>
          </div>
        )}

        {/* Date range */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Input
            label="Start Date *"
            type="date"
            error={errors.startDate?.message}
            {...register("startDate")}
          />
          <Input
            label="End Date *"
            type="date"
            error={errors.endDate?.message}
            {...register("endDate")}
          />
        </div>

        {/* Days count */}
        {daysCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              backgroundColor: "#1A1A1E",
              borderRadius: "8px",
              border: "1px solid #27272A",
            }}
          >
            <CalendarDays size={14} style={{ color: "#F5A623" }} />
            <span style={{ fontSize: "13px", color: "#E8E8E8" }}>
              <strong style={{ color: "#F5A623" }}>{daysCount}</strong> working day{daysCount !== 1 ? "s" : ""} requested
            </span>
          </div>
        )}

        {/* Reason */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#A1A1AA", marginBottom: "6px" }}>
            Reason <span style={{ color: "#52525B" }}>(optional)</span>
          </label>
          <textarea
            {...register("reason")}
            placeholder="Briefly describe the reason for your leave request..."
            style={{
              width: "100%",
              backgroundColor: "#111113",
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
            onFocus={(e) => { e.currentTarget.style.borderColor = "#F5A623"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#27272A"; }}
          />
        </div>

        {/* Custom category hint */}
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: "#1A1A1E",
            borderRadius: "8px",
            border: "1px solid #27272A",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#52525B" }}>
            Can&apos;t find your leave type?{" "}
            <span style={{ color: "#F5A623", cursor: "pointer" }}>
              Contact your administrator
            </span>{" "}
            to add custom leave categories.
          </p>
        </div>
      </form>
    </Modal>
  );
}
