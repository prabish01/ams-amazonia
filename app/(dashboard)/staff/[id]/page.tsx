"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar, Pencil, User, CreditCard, Building2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, EmploymentBadge, RoleBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SkeletonLine, SkeletonCard } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { useStaffMember, useUpdateStaff } from "@/hooks/use-staff";
import { useRestaurants } from "@/hooks/use-restaurants";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

const FIELD_LABEL: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
  color: "#52525B",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const FIELD_VALUE: React.CSSProperties = {
  margin: "2px 0 0",
  fontSize: "13px",
  color: "#A1A1AA",
};

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={FIELD_LABEL}>{label}</p>
      <p style={FIELD_VALUE}>{value || "—"}</p>
    </div>
  );
}

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const [roleValue, setRoleValue] = useState<string>("");
  const [employmentValue, setEmploymentValue] = useState<string>("");
  const [restaurantValue, setRestaurantValue] = useState<string>("");
  const [activeValue, setActiveValue] = useState<string>("");
  const [nicknameValue, setNicknameValue] = useState<string>("");
  const [phoneValue, setPhoneValue] = useState<string>("");
  const [hkidValue, setHkidValue] = useState<string>("");
  const [bankNameValue, setBankNameValue] = useState<string>("");
  const [bankCodeValue, setBankCodeValue] = useState<string>("");
  const [bankAccValue, setBankAccValue] = useState<string>("");
  // Payroll Settings
  const [staffNumberValue, setStaffNumberValue] = useState<string>("");
  const [autopayDayValue, setAutopayDayValue] = useState<string>("7");
  const [monthlySalaryValue, setMonthlySalaryValue] = useState<string>("");
  const [foodAllowanceValue, setFoodAllowanceValue] = useState<string>("");
  const [incentiveValue, setIncentiveValue] = useState<string>("");
  const [monthlyDeductionValue, setMonthlyDeductionValue] = useState<string>("");
  const [monthlyAdjustmentValue, setMonthlyAdjustmentValue] = useState<string>("");

  const { data: member, isLoading } = useStaffMember(id);
  const { data: restaurants } = useRestaurants();
  const { mutate: updateStaff, isPending } = useUpdateStaff();

  React.useEffect(() => {
    if (member) {
      setRoleValue(member.role);
      setEmploymentValue(member.employmentType);
      setRestaurantValue(member.restaurantId ?? "");
      setActiveValue(member.isActive ? "true" : "false");
      setNicknameValue(member.nickname ?? "");
      setPhoneValue(member.phone ?? "");
      setHkidValue(member.hkid ?? "");
      setBankNameValue(member.bankName ?? "");
      setBankCodeValue(member.bankCode ?? "");
      setBankAccValue(member.bankAccountNumber ?? "");
      // Payroll
      setStaffNumberValue(member.staffNumber ?? "");
      setAutopayDayValue(String(member.autopayDay ?? 7));
      setMonthlySalaryValue(member.monthlySalary ?? "");
      setFoodAllowanceValue(member.foodAllowance ?? "");
      setIncentiveValue(member.incentive ?? "");
      setMonthlyDeductionValue(member.monthlyDeduction ?? "");
      setMonthlyAdjustmentValue(member.monthlyAdjustment ?? "");
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
          nickname: nicknameValue,
          phone: phoneValue,
          hkid: hkidValue,
          bankName: bankNameValue,
          bankCode: bankCodeValue,
          bankAccountNumber: bankAccValue,
          // Payroll
          staffNumber: staffNumberValue || null,
          autopayDay: autopayDayValue ? Number(autopayDayValue) : null,
          monthlySalary: monthlySalaryValue ? Number(monthlySalaryValue) : null,
          foodAllowance: foodAllowanceValue ? Number(foodAllowanceValue) : null,
          incentive: incentiveValue ? Number(incentiveValue) : null,
          monthlyDeduction: monthlyDeductionValue ? Number(monthlyDeductionValue) : null,
          monthlyAdjustment: monthlyAdjustmentValue ? Number(monthlyAdjustmentValue) : null,
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
      setNicknameValue(member.nickname ?? "");
      setPhoneValue(member.phone ?? "");
      setHkidValue(member.hkid ?? "");
      setBankNameValue(member.bankName ?? "");
      setBankCodeValue(member.bankCode ?? "");
      setBankAccValue(member.bankAccountNumber ?? "");
      setStaffNumberValue(member.staffNumber ?? "");
      setAutopayDayValue(String(member.autopayDay ?? 7));
      setMonthlySalaryValue(member.monthlySalary ?? "");
      setFoodAllowanceValue(member.foodAllowance ?? "");
      setIncentiveValue(member.incentive ?? "");
      setMonthlyDeductionValue(member.monthlyDeduction ?? "");
      setMonthlyAdjustmentValue(member.monthlyAdjustment ?? "");
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

  const gridTwo: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "14px",
  };

  const sectionLabel: React.CSSProperties = {
    margin: "0 0 10px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#52525B",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

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
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>{member.name}</h1>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#52525B" }}>Staff profile</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {editing ? (
            <>
              <Button variant="secondary" size="md" onClick={handleCancel} disabled={isPending}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} loading={isPending}>Save Changes</Button>
            </>
          ) : (
            <Button variant="secondary" size="md" onClick={() => setEditing(true)} iconLeft={<Pencil size={14} />}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#E8E8E8" }}>{member.name}</h2>
                {member.nickname && (
                  <span style={{ fontSize: "13px", color: "#71717A" }}>({member.nickname})</span>
                )}
                <Badge variant={member.isActive ? "success" : "neutral"} size="sm" dot>
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

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

              {!editing && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <RoleBadge role={member.role as "SUPER_ADMIN" | "ADMIN" | "STAFF"} size="sm" />
                  <EmploymentBadge type={member.employmentType as "FULL_TIME" | "PART_TIME"} size="sm" />
                  {member.restaurant && <Badge variant="neutral" size="sm">{member.restaurant.name}</Badge>}
                  {member.staffCategory && <Badge variant="neutral" size="sm">{member.staffCategory.name}</Badge>}
                </div>
              )}
            </div>
          </div>

          {editing && (
            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #1A1A1E", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <p style={sectionLabel}>Personal Details</p>
                <div style={gridTwo}>
                  <Input label="Nickname" value={nicknameValue} onChange={(e) => setNicknameValue(e.target.value)} placeholder="e.g. Tai Man" />
                  <Input label="Phone" value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)} placeholder="+852 9XXX XXXX" />
                  <Input label="HKID" value={hkidValue} onChange={(e) => setHkidValue(e.target.value)} placeholder="e.g. A123456(7)" />
                </div>
              </div>

              <div>
                <p style={sectionLabel}>Employment</p>
                <div style={gridTwo}>
                  <Select
                    label="Role"
                    options={[{ value: "STAFF", label: "Staff" }, { value: "ADMIN", label: "Admin" }]}
                    value={roleValue}
                    onChange={(e) => setRoleValue(e.target.value)}
                  />
                  <Select
                    label="Employment Type"
                    options={[{ value: "FULL_TIME", label: "Full Time" }, { value: "PART_TIME", label: "Part Time" }]}
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
                    options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]}
                    value={activeValue}
                    onChange={(e) => setActiveValue(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <p style={sectionLabel}>Bank Details (for payroll exports)</p>
                <div style={gridTwo}>
                  <Input label="Bank Name" value={bankNameValue} onChange={(e) => setBankNameValue(e.target.value)} placeholder="e.g. HSBC" />
                  <Input label="Bank Code" value={bankCodeValue} onChange={(e) => setBankCodeValue(e.target.value)} placeholder="e.g. 004" />
                  <div style={{ gridColumn: "span 2" }}>
                    <Input label="Account Number" value={bankAccValue} onChange={(e) => setBankAccValue(e.target.value)} placeholder="e.g. 123-456789-001" />
                  </div>
                </div>
              </div>

              <div>
                <p style={sectionLabel}>Payroll Settings</p>
                <div style={gridTwo}>
                  <Input
                    label="Staff Number"
                    value={staffNumberValue}
                    onChange={(e) => setStaffNumberValue(e.target.value)}
                    placeholder="e.g. 001"
                  />
                  <Input
                    label="Autopay Day (day of month)"
                    type="number"
                    value={autopayDayValue}
                    onChange={(e) => setAutopayDayValue(e.target.value)}
                    placeholder="1–28, default: 7"
                  />
                  <Input
                    label="Monthly Salary (HK$)"
                    type="number"
                    value={monthlySalaryValue}
                    onChange={(e) => setMonthlySalaryValue(e.target.value)}
                    placeholder="e.g. 18000"
                  />
                  <Input
                    label="Food Allowance (HK$)"
                    type="number"
                    value={foodAllowanceValue}
                    onChange={(e) => setFoodAllowanceValue(e.target.value)}
                    placeholder="e.g. 800"
                  />
                  <Input
                    label="Incentive / OT Top-up (HK$)"
                    type="number"
                    value={incentiveValue}
                    onChange={(e) => setIncentiveValue(e.target.value)}
                    placeholder="e.g. 500"
                  />
                  <Input
                    label="Other Deduction (HK$)"
                    type="number"
                    value={monthlyDeductionValue}
                    onChange={(e) => setMonthlyDeductionValue(e.target.value)}
                    placeholder="e.g. 200"
                  />
                  <Input
                    label="Adjustment (HK$, +/–)"
                    type="number"
                    value={monthlyAdjustmentValue}
                    onChange={(e) => setMonthlyAdjustmentValue(e.target.value)}
                    placeholder="e.g. -100 or 300"
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #1A1A1E", display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div>
              <p style={FIELD_LABEL}>Member Since</p>
              <p style={FIELD_VALUE}>{format(new Date(member.createdAt), "d MMM yyyy")}</p>
            </div>
            <div>
              <p style={FIELD_LABEL}>Last Updated</p>
              <p style={FIELD_VALUE}>{format(new Date(member.updatedAt), "d MMM yyyy")}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Payroll Info Card (read-only, shown when data exists) */}
      {!editing && (member.hkid || member.bankName || member.bankAccountNumber || member.staffNumber || member.monthlySalary) && (
        <Card>
          <CardHeader title="Payroll Information" icon={<DollarSign size={14} />} />
          <CardBody>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
              <InfoField label="Staff Number" value={member.staffNumber} />
              <InfoField label="Autopay Day" value={member.autopayDay ? `${member.autopayDay}th of next month` : null} />
              <InfoField label="Monthly Salary" value={member.monthlySalary ? `HK$ ${Number(member.monthlySalary).toLocaleString()}` : null} />
              <InfoField label="Food Allowance" value={member.foodAllowance ? `HK$ ${Number(member.foodAllowance).toLocaleString()}` : null} />
              <InfoField label="Incentive" value={member.incentive ? `HK$ ${Number(member.incentive).toLocaleString()}` : null} />
              <InfoField label="Other Deduction" value={member.monthlyDeduction ? `HK$ ${Number(member.monthlyDeduction).toLocaleString()}` : null} />
              <InfoField label="Adjustment" value={member.monthlyAdjustment ? `HK$ ${Number(member.monthlyAdjustment).toLocaleString()}` : null} />
              <InfoField label="HKID" value={member.hkid} />
              <InfoField label="Bank" value={member.bankName} />
              <InfoField label="Bank Code" value={member.bankCode} />
              <InfoField label="Account Number" value={member.bankAccountNumber} />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Prompt to fill bank info if empty */}
      {!editing && !member.hkid && !member.bankName && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(245,166,35,0.06)",
            border: "1px solid rgba(245,166,35,0.15)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={14} style={{ color: "#D49D1C", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: "13px", color: "#A1A1AA" }}>
              Bank details and HKID are not set. Add them for accurate payroll exports.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Add Details</Button>
        </div>
      )}
    </div>
  );
}
