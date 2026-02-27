"use client";

import React, { useState } from "react";
import { DollarSign, Edit2, Check, X, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useSalaryRates, useCreateSalaryRate } from "@/hooks/use-salary";
import { useStaff } from "@/hooks/use-staff";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

type TabType = "categories" | "individual";

export default function SalaryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("categories");
  const [search, setSearch] = useState("");
  const [editingRate, setEditingRate] = useState<{ id?: string; type: "category" | "individual"; name: string; currentRate?: string; staffId?: string; categoryId?: string } | null>(null);
  const [newRate, setNewRate] = useState("");

  const { data: auth } = useAuth();
  const { data: rates, isLoading: ratesLoading } = useSalaryRates(auth?.restaurantId || "");
  const { data: staff, isLoading: staffLoading } = useStaff();
  const { mutate: createRate, isPending: savingRate } = useCreateSalaryRate();

  const filteredStaff = staff?.filter((s) => {
    if (!search) return true;
    return s.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleSaveRate = () => {
    if (!newRate || !editingRate) return;
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }
    createRate(
      {
        staffId: editingRate.staffId,
        categoryId: editingRate.categoryId,
        hourlyRate: rate.toString(),
        restaurantId: auth?.restaurantId || "",
      },
      {
        onSuccess: () => {
          toast.success(`Rate updated for ${editingRate.name}`);
          setEditingRate(null);
          setNewRate("");
        },
        onError: () => toast.error("Failed to update rate"),
      }
    );
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "categories", label: "By Category" },
    { key: "individual", label: "Individual Overrides" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>Salary</h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
          Configure hourly rates for staff categories and individuals
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", backgroundColor: "#111113", borderRadius: "10px", padding: "4px", border: "1px solid #27272A", width: "fit-content" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "7px 18px",
              borderRadius: "7px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              backgroundColor: activeTab === tab.key ? "#F5A623" : "transparent",
              color: activeTab === tab.key ? "#0A0A0B" : "#A1A1AA",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "categories" && (
        <Card>
          <CardHeader
            title="Staff Categories"
            subtitle="Base hourly rates per category"
            icon={<DollarSign size={14} />}
          />
          <CardBody padding={false}>
            {ratesLoading ? (
              <div style={{ padding: "16px" }}>
                <SkeletonTable rows={3} cols={4} />
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 100px",
                    padding: "10px 20px",
                    borderBottom: "1px solid #27272A",
                    gap: "12px",
                  }}
                >
                  {["Category", "Hourly Rate (HKD)", "Effective From", "Action"].map((h) => (
                    <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </span>
                  ))}
                </div>

                {rates?.filter((r) => r.categoryId && !r.staffId).map((rate, i) => (
                  <div
                    key={rate.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 100px",
                      padding: "14px 20px",
                      borderBottom: "1px solid #1A1A1E",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>
                        {rate.category?.name || "—"}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#52525B" }}>HK$</span>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#F5A623" }}>
                        {parseFloat(rate.hourlyRate).toFixed(2)}
                      </span>
                      <span style={{ fontSize: "12px", color: "#52525B" }}>/hr</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#A1A1AA" }}>
                      {format(new Date(rate.effectiveFrom), "d MMM yyyy")}
                    </span>
                    <button
                      onClick={() => {
                        setEditingRate({ id: rate.id, type: "category", name: rate.category?.name || "Category", currentRate: rate.hourlyRate, categoryId: rate.categoryId || undefined });
                        setNewRate(rate.hourlyRate);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        backgroundColor: "transparent",
                        border: "1px solid #27272A",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        cursor: "pointer",
                        color: "#A1A1AA",
                        fontSize: "12px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5A623"; e.currentTarget.style.color = "#F5A623"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#27272A"; e.currentTarget.style.color = "#A1A1AA"; }}
                    >
                      <Edit2 size={11} /> Set Rate
                    </button>
                  </div>
                ))}

                {!rates?.filter((r) => r.categoryId && !r.staffId).length && (
                  <EmptyState
                    icon={<DollarSign size={20} />}
                    title="No category rates set"
                    description="Set hourly rates for staff categories."
                    compact
                  />
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === "individual" && (
        <Card>
          <CardHeader
            title="Individual Rate Overrides"
            subtitle="Set custom rates for specific staff members"
            icon={<DollarSign size={14} />}
          />
          <CardBody>
            <div style={{ marginBottom: "16px" }}>
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                iconPrefix={<Search size={14} />}
              />
            </div>

            {staffLoading ? (
              <SkeletonTable rows={4} cols={4} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {filteredStaff?.map((member) => {
                  const override = rates?.find((r) => r.staffId === member.id);
                  return (
                    <div
                      key={member.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        backgroundColor: "#1A1A1E",
                        border: "1px solid transparent",
                        transition: "border-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#27272A"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      <Avatar src={member.avatarUrl} name={member.name} size="sm" />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>
                          {member.name}
                        </p>
                        <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#52525B" }}>
                          {member.staffCategory?.name || "No category"}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {override ? (
                          <div>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#F5A623" }}>
                              HK$ {parseFloat(override.hourlyRate).toFixed(2)}/hr
                            </p>
                            <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#52525B" }}>Override</p>
                          </div>
                        ) : (
                          <p style={{ margin: 0, fontSize: "12px", color: "#52525B" }}>Category rate</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingRate({
                            id: override?.id,
                            type: "individual",
                            name: member.name,
                            currentRate: override?.hourlyRate,
                            staffId: member.id,
                          });
                          setNewRate(override?.hourlyRate || "");
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          backgroundColor: "transparent",
                          border: "1px solid #27272A",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          cursor: "pointer",
                          color: "#A1A1AA",
                          fontSize: "12px",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F5A623"; e.currentTarget.style.color = "#F5A623"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#27272A"; e.currentTarget.style.color = "#A1A1AA"; }}
                      >
                        <Edit2 size={11} /> Set
                      </button>
                    </div>
                  );
                })}
                {!filteredStaff?.length && (
                  <EmptyState icon={<Search size={20} />} title="No staff found" compact />
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Set Rate Modal */}
      <Modal
        isOpen={!!editingRate}
        onClose={() => { setEditingRate(null); setNewRate(""); }}
        title={`Set Rate — ${editingRate?.name}`}
        size="sm"
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={() => { setEditingRate(null); setNewRate(""); }} disabled={savingRate}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRate} loading={savingRate}>
              Save Rate
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {editingRate?.currentRate && (
            <div style={{ padding: "10px 14px", backgroundColor: "#1A1A1E", borderRadius: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#52525B" }}>Current rate</p>
              <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700, color: "#E8E8E8" }}>
                HK$ {parseFloat(editingRate.currentRate).toFixed(2)} / hour
              </p>
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#A1A1AA", marginBottom: "6px" }}>
              New Hourly Rate (HKD) *
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#111113",
                border: "1px solid #27272A",
                borderRadius: "8px",
                padding: "0 12px",
                height: "44px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#52525B", fontWeight: 600 }}>HK$</span>
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#E8E8E8",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              />
              <span style={{ fontSize: "13px", color: "#52525B" }}>/ hr</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
