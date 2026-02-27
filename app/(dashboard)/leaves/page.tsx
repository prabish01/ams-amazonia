"use client";

import React, { useState } from "react";
import { Plus, CalendarDays, Filter } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { RequestLeaveModal } from "@/components/leaves/request-leave-modal";
import { useLeaveBalance, useLeaveRequests } from "@/hooks/use-leaves";
import type { LeaveStatus } from "@/types";

const statusOptions: { value: string; label: string }[] = [
  { value: "ALL", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function LeavesPage() {
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: balances, isLoading: balancesLoading } = useLeaveBalance();
  const { data: requests, isLoading: requestsLoading } = useLeaveRequests({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>Leave</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
            Manage your leave requests and balances
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setRequestModalOpen(true)}
          iconLeft={<Plus size={16} />}
        >
          Request Leave
        </Button>
      </div>

      {/* Balances */}
      <div>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Leave Balances {new Date().getFullYear()}
        </h3>
        {balancesLoading ? (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ width: 160, height: 80, backgroundColor: "#111113", border: "1px solid #27272A", borderRadius: "10px" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {balances?.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: "#111113",
                  border: "1px solid #27272A",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  minWidth: "160px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Progress bar */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#27272A",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${b.allocated > 0 ? ((b.allocated - b.remaining) / b.allocated) * 100 : 0}%`,
                      backgroundColor: "#F5A623",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 600, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {b.category?.name || "—"}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#E8E8E8" }}>{b.remaining}</span>
                  <span style={{ fontSize: "13px", color: "#52525B" }}>/ {b.allocated} days</span>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#52525B" }}>{b.used} used</span>
                  {b.pending > 0 && (
                    <span style={{ fontSize: "11px", color: "#EAB308" }}>{b.pending} pending</span>
                  )}
                </div>
              </div>
            ))}
            {!balances?.length && (
              <p style={{ fontSize: "13px", color: "#52525B" }}>No leave balances found</p>
            )}
          </div>
        )}
      </div>

      {/* Requests table */}
      <Card>
        <CardHeader
          title="My Leave Requests"
          subtitle="All your submitted leave requests"
          icon={<CalendarDays size={14} />}
          action={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                backgroundColor: "#1A1A1E",
                border: "1px solid #27272A",
                borderRadius: "6px",
                padding: "5px 28px 5px 10px",
                color: "#E8E8E8",
                fontSize: "12px",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ backgroundColor: "#1A1A1E" }}>
                  {opt.label}
                </option>
              ))}
            </select>
          }
        />
        <CardBody padding={false}>
          {requestsLoading ? (
            <div style={{ padding: "16px" }}>
              <SkeletonTable rows={4} cols={5} />
            </div>
          ) : !requests?.length ? (
            <EmptyState
              icon={<CalendarDays size={22} />}
              title="No leave requests"
              description="You haven't submitted any leave requests yet."
              action={{
                label: "Request Leave",
                onClick: () => setRequestModalOpen(true),
                icon: <Plus size={14} />,
              }}
              compact
            />
          ) : (
            <>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 60px 1fr",
                  padding: "10px 20px",
                  borderBottom: "1px solid #27272A",
                  gap: "12px",
                }}
              >
                {["Leave Type", "From", "To", "Days", "Status"].map((h) => (
                  <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </span>
                ))}
              </div>

              {requests.map((req, i) => (
                <div
                  key={req.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1fr 60px 1fr",
                    padding: "14px 20px",
                    borderBottom: i < requests.length - 1 ? "1px solid #1A1A1E" : undefined,
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>
                      {req.category?.name || "—"}
                    </p>
                    {req.reason && (
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#52525B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                        {req.reason}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                    {format(new Date(req.startDate), "d MMM yyyy")}
                  </span>
                  <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                    {format(new Date(req.endDate), "d MMM yyyy")}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#E8E8E8" }}>
                    {req.daysRequested}
                  </span>
                  <StatusBadge status={req.status as LeaveStatus} size="sm" />
                </div>
              ))}
            </>
          )}
        </CardBody>
      </Card>

      <RequestLeaveModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
    </div>
  );
}
