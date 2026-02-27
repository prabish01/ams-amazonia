"use client";

import React, { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { BarChart3, Download, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useStaff } from "@/hooks/use-staff";
import { useRestaurants } from "@/hooks/use-restaurants";
import { useMutation } from "@tanstack/react-query";

type ReportType = "individual" | "restaurant" | "all";
type PeriodType = "weekly" | "monthly" | "custom";

interface ReportData {
  staffId: string;
  staffName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  grossEarnings: number;
  leavePayments: number;
  totalPayable: number;
  leaveDays: number;
}

function getPeriodDates(period: PeriodType, customStart?: string, customEnd?: string) {
  const now = new Date();
  if (period === "weekly") {
    return {
      start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }
  if (period === "monthly") {
    const lastMonth = subMonths(now, 1);
    return {
      start: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
      end: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
    };
  }
  return {
    start: customStart || format(startOfMonth(now), "yyyy-MM-dd"),
    end: customEnd || format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

export default function ReportsPage() {
  const { data: auth } = useAuth();
  const { data: staff } = useStaff();
  const { data: restaurants } = useRestaurants();

  const [reportType, setReportType] = useState<ReportType>("individual");
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [reportData, setReportData] = useState<ReportData[]>([]);

  const { mutate: generateReport, isPending: generating } = useMutation({
    mutationFn: async () => {
      const { start, end } = getPeriodDates(period, customStart, customEnd);
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          staffId: reportType === "individual" ? selectedStaffId : undefined,
          restaurantId: reportType === "restaurant" ? selectedRestaurantId : undefined,
          start,
          end,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      return data.rows as ReportData[];
    },
    onSuccess: (data) => {
      setReportData(data);
      if (!data.length) {
        toast.info("No data found for the selected period");
      }
    },
    onError: () => toast.error("Failed to generate report"),
  });

  const handleExportCSV = () => {
    if (!reportData.length) return;
    const headers = ["Staff", "Total Hours", "Regular Hrs", "Overtime Hrs", "Rate (HKD)", "Gross Earnings", "Leave Pay", "Total Payable", "Leave Days"];
    const rows = reportData.map((r) => [
      r.staffName,
      r.totalHours.toFixed(2),
      r.regularHours.toFixed(2),
      r.overtimeHours.toFixed(2),
      r.hourlyRate.toFixed(2),
      r.grossEarnings.toFixed(2),
      r.leavePayments.toFixed(2),
      r.totalPayable.toFixed(2),
      r.leaveDays,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amazonia-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const handleExportPDF = () => {
    toast.info("PDF export coming soon");
  };

  const { start, end } = getPeriodDates(period, customStart, customEnd);

  const reportTypeOptions = [
    { value: "individual", label: "Individual Staff" },
    { value: "restaurant", label: "Restaurant" },
    ...(auth?.role === "SUPER_ADMIN" ? [{ value: "all", label: "All Restaurants" }] : []),
  ];

  const periodOptions = [
    { value: "weekly", label: "This Week" },
    { value: "monthly", label: "Last Month" },
    { value: "custom", label: "Custom Range" },
  ];

  const staffOptions = [
    { value: "", label: "Select staff member" },
    ...(staff?.map((s) => ({ value: s.id, label: s.name })) || []),
  ];

  const restaurantOptions = [
    { value: "", label: "Select restaurant" },
    ...(restaurants?.map((r) => ({ value: r.id, label: r.name })) || []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>Reports</h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
          Generate payroll and attendance reports
        </p>
      </div>

      {/* Report config */}
      <Card>
        <CardHeader title="Report Configuration" icon={<BarChart3 size={14} />} />
        <CardBody>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              <Select
                label="Report Type"
                options={reportTypeOptions}
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              />
              <Select
                label="Period"
                options={periodOptions}
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
              />
              {reportType === "individual" && (
                <Select
                  label="Staff Member"
                  options={staffOptions}
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                />
              )}
              {reportType === "restaurant" && (
                <Select
                  label="Restaurant"
                  options={restaurantOptions}
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                />
              )}
            </div>

            {period === "custom" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "400px" }}>
                <Input
                  label="Start Date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Button
                variant="primary"
                onClick={() => generateReport()}
                loading={generating}
                iconLeft={<BarChart3 size={15} />}
              >
                Generate Report
              </Button>
              <span style={{ fontSize: "12px", color: "#52525B" }}>
                {start} to {end}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Report output */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader
            title="Report Results"
            subtitle={`${reportData.length} staff member${reportData.length !== 1 ? "s" : ""} • ${start} to ${end}`}
            icon={<FileText size={14} />}
            action={
              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="secondary" size="sm" onClick={handleExportCSV} iconLeft={<Download size={13} />}>
                  CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={handleExportPDF} iconLeft={<Download size={13} />}>
                  PDF
                </Button>
              </div>
            }
          />
          <CardBody padding={false}>
            {/* Totals row */}
            <div
              style={{
                display: "flex",
                gap: "20px",
                padding: "14px 20px",
                backgroundColor: "rgba(245,166,35,0.05)",
                borderBottom: "1px solid #27272A",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "Total Hours", value: reportData.reduce((s, r) => s + r.totalHours, 0).toFixed(1) + "h" },
                { label: "Total Payable", value: "HK$ " + reportData.reduce((s, r) => s + r.totalPayable, 0).toFixed(2) },
                { label: "Leave Days", value: reportData.reduce((s, r) => s + r.leaveDays, 0) + " days" },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: "18px", fontWeight: 700, color: "#F5A623" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
                padding: "10px 20px",
                borderBottom: "1px solid #27272A",
                gap: "12px",
              }}
            >
              {["Staff", "Total Hrs", "Regular", "Overtime", "Rate", "Gross", "Total Payable"].map((h) => (
                <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </span>
              ))}
            </div>

            {reportData.map((row, i) => (
              <div
                key={row.staffId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
                  padding: "14px 20px",
                  borderBottom: i < reportData.length - 1 ? "1px solid #1A1A1E" : undefined,
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Avatar name={row.staffName} size="sm" />
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>{row.staffName}</span>
                </div>
                <span style={{ fontSize: "13px", color: "#A1A1AA" }}>{row.totalHours.toFixed(1)}h</span>
                <span style={{ fontSize: "13px", color: "#A1A1AA" }}>{row.regularHours.toFixed(1)}h</span>
                <span style={{ fontSize: "13px", color: row.overtimeHours > 0 ? "#F5A623" : "#A1A1AA" }}>
                  {row.overtimeHours.toFixed(1)}h
                </span>
                <span style={{ fontSize: "13px", color: "#A1A1AA" }}>HK$ {row.hourlyRate.toFixed(0)}</span>
                <span style={{ fontSize: "13px", color: "#A1A1AA" }}>HK$ {row.grossEarnings.toFixed(0)}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#22C55E" }}>HK$ {row.totalPayable.toFixed(0)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {!reportData.length && !generating && (
        <EmptyState
          icon={<BarChart3 size={22} />}
          title="No report generated"
          description="Configure the report settings above and click Generate Report."
        />
      )}
    </div>
  );
}
