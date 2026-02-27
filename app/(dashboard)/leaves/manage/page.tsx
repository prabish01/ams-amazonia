"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Check, X, Filter, Search, ChevronRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useLeaveRequests, useUpdateLeaveRequest } from "@/hooks/use-leaves";
import type { LeaveRequest, LeaveStatus } from "@/types";

export default function ManageLeavesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED" | null>(null);

  const { data: requests, isLoading } = useLeaveRequests({ status: statusFilter !== "ALL" ? statusFilter : undefined });
  const { mutate: updateRequest, isPending: updating } = useUpdateLeaveRequest();

  const filteredRequests = requests?.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.staff?.name?.toLowerCase().includes(q) ||
      r.category?.name?.toLowerCase().includes(q)
    );
  });

  const handleReview = (action: "APPROVED" | "REJECTED") => {
    if (!selectedRequest) return;
    updateRequest(
      {
        id: selectedRequest.id,
        status: action,
        reviewNote: reviewNote || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Leave request ${action.toLowerCase()} successfully`);
          setSelectedRequest(null);
          setReviewNote("");
          setReviewAction(null);
        },
        onError: () => toast.error("Failed to update leave request"),
      }
    );
  };

  const statusOptions = [
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "ALL", label: "All" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>
          Leave Management
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
          Review and manage staff leave requests
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "200px", maxWidth: "320px" }}>
          <Input
            placeholder="Search by staff name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            iconPrefix={<Search size={14} />}
          />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: `1px solid ${statusFilter === opt.value ? "#F5A623" : "#27272A"}`,
                backgroundColor: statusFilter === opt.value ? "rgba(245,166,35,0.1)" : "transparent",
                color: statusFilter === opt.value ? "#F5A623" : "#A1A1AA",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {opt.label}
              {opt.value === "PENDING" && requests?.filter((r) => r.status === "PENDING").length ? (
                <span
                  style={{
                    marginLeft: "6px",
                    backgroundColor: "#F5A623",
                    color: "#0A0A0B",
                    borderRadius: "10px",
                    padding: "0 5px",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {requests.filter((r) => r.status === "PENDING").length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader
          title="Leave Requests"
          subtitle={`${filteredRequests?.length || 0} requests`}
        />
        <CardBody padding={false}>
          {isLoading ? (
            <div style={{ padding: "16px" }}>
              <SkeletonTable rows={5} cols={6} />
            </div>
          ) : !filteredRequests?.length ? (
            <EmptyState
              icon={<Filter size={22} />}
              title="No leave requests"
              description={statusFilter === "PENDING" ? "No pending leave requests to review." : "No requests match your filter."}
              compact
            />
          ) : (
            <>
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.2fr 1.5fr 60px 90px 120px",
                  padding: "10px 20px",
                  borderBottom: "1px solid #27272A",
                  gap: "12px",
                }}
              >
                {["Staff", "Type", "Dates", "Days", "Status", "Actions"].map((h) => (
                  <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </span>
                ))}
              </div>

              {filteredRequests.map((req, i) => (
                <div
                  key={req.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.2fr 1.5fr 60px 90px 120px",
                    padding: "14px 20px",
                    borderBottom: i < filteredRequests.length - 1 ? "1px solid #1A1A1E" : undefined,
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  {/* Staff */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar
                      src={req.staff?.avatarUrl}
                      name={req.staff?.name || "—"}
                      size="sm"
                    />
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>
                        {req.staff?.name || "—"}
                      </p>
                      {req.reason && (
                        <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#52525B", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {req.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Type */}
                  <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                    {req.category?.name || "—"}
                  </span>

                  {/* Dates */}
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#E8E8E8" }}>
                      {format(new Date(req.startDate), "d MMM")} → {format(new Date(req.endDate), "d MMM yyyy")}
                    </p>
                  </div>

                  {/* Days */}
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#E8E8E8" }}>
                    {req.daysRequested}
                  </span>

                  {/* Status */}
                  <StatusBadge status={req.status as LeaveStatus} size="sm" />

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {req.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => { setSelectedRequest(req); setReviewAction("APPROVED"); }}
                          style={{
                            width: 28, height: 28,
                            borderRadius: "6px",
                            backgroundColor: "rgba(34,197,94,0.1)",
                            border: "1px solid rgba(34,197,94,0.2)",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#22C55E",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.2)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.1)"; }}
                          title="Approve"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => { setSelectedRequest(req); setReviewAction("REJECTED"); }}
                          style={{
                            width: 28, height: 28,
                            borderRadius: "6px",
                            backgroundColor: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#EF4444",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.2)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }}
                          title="Reject"
                        >
                          <X size={13} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setSelectedRequest(req); setReviewAction(null); }}
                      style={{
                        width: 28, height: 28,
                        borderRadius: "6px",
                        backgroundColor: "transparent",
                        border: "1px solid #27272A",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#52525B",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1A1A1E"; e.currentTarget.style.color = "#E8E8E8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#52525B"; }}
                      title="View details"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardBody>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => { setSelectedRequest(null); setReviewNote(""); setReviewAction(null); }}
        title={reviewAction === "APPROVED" ? "Approve Leave Request" : reviewAction === "REJECTED" ? "Reject Leave Request" : "Leave Request Details"}
        size="sm"
        footer={
          reviewAction ? (
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button
                variant="secondary"
                onClick={() => { setSelectedRequest(null); setReviewNote(""); setReviewAction(null); }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                variant={reviewAction === "APPROVED" ? "primary" : "danger"}
                onClick={() => handleReview(reviewAction)}
                loading={updating}
              >
                Confirm {reviewAction === "APPROVED" ? "Approval" : "Rejection"}
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedRequest && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Avatar src={selectedRequest.staff?.avatarUrl} name={selectedRequest.staff?.name || "?"} size="lg" />
              <div>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#E8E8E8" }}>
                  {selectedRequest.staff?.name}
                </p>
                <StatusBadge status={selectedRequest.status as LeaveStatus} size="sm" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "Leave Type", value: selectedRequest.category?.name || "—" },
                { label: "Days", value: `${selectedRequest.daysRequested} days` },
                { label: "From", value: format(new Date(selectedRequest.startDate), "d MMM yyyy") },
                { label: "To", value: format(new Date(selectedRequest.endDate), "d MMM yyyy") },
              ].map((item) => (
                <div key={item.label} style={{ backgroundColor: "#1A1A1E", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {item.label}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 600, color: "#E8E8E8" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {selectedRequest.reason && (
              <div style={{ backgroundColor: "#1A1A1E", borderRadius: "8px", padding: "12px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Reason
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#A1A1AA" }}>{selectedRequest.reason}</p>
              </div>
            )}

            {reviewAction && (
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#A1A1AA", marginBottom: "6px" }}>
                  Review Note <span style={{ color: "#52525B" }}>(optional)</span>
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={`Add a note for ${reviewAction === "APPROVED" ? "approval" : "rejection"}...`}
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
                    minHeight: "72px",
                    transition: "border-color 0.15s ease",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#F5A623"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#27272A"; }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
