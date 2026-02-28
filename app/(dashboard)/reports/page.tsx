"use client";

import React, { useState } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  sub,
} from "date-fns";
import {
  BarChart3,
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  FileDown,
} from "lucide-react";
import { exportReportPDF } from "@/lib/export-pdf";
import { exportReportExcel } from "@/lib/export-excel";
import { exportPTReportPDF } from "@/lib/export-pt-pdf";
import { exportPTReportExcel } from "@/lib/export-pt-excel";
import { exportPayslipPDF } from "@/lib/export-payslip-pdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useStaff } from "@/hooks/use-staff";
import { useRestaurants } from "@/hooks/use-restaurants";
import { useMutation } from "@tanstack/react-query";
import type { PTExportPayload } from "@/lib/export-pt-pdf";

type ReportType = "individual" | "restaurant" | "all";
type PeriodType = "weekly" | "monthly" | "custom";
type EmploymentType = "PART_TIME" | "FULL_TIME";

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

  const [reportType, setReportType] = useState<ReportType>("restaurant");
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [employmentType, setEmploymentType] = useState<EmploymentType>("PART_TIME");
  const [isExporting, setIsExporting] = useState(false);

  // ─── Payslip state ───────────────────────────────────────────────────────
  const defaultMonth = format(sub(new Date(), { months: 1 }), "yyyy-MM");
  const [payslipMonth, setPayslipMonth] = useState(defaultMonth);
  const [payslipRestaurantId, setPayslipRestaurantId] = useState("");
  const [payslipStaffType, setPayslipStaffType] = useState<"ALL" | "FULL_TIME" | "PART_TIME">("ALL");
  const [isGeneratingPayslip, setIsGeneratingPayslip] = useState(false);

  // ─── Compute period dates ──────────────────────────────────────────────────

  const { start, end } = getPeriodDates(period, customStart, customEnd);

  // ─── Generate in-browser report ───────────────────────────────────────────

  const { mutate: generateReport, isPending: generating } = useMutation({
    mutationFn: async () => {
      const isAllStaff = reportType === "individual" && selectedStaffId === "__ALL__";
      const allStaffRestaurantId =
        auth?.role === "SUPER_ADMIN" ? selectedRestaurantId : (auth?.restaurantId ?? "");

      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isAllStaff ? "restaurant" : reportType,
          staffId: reportType === "individual" && !isAllStaff ? selectedStaffId : undefined,
          restaurantId: isAllStaff
            ? allStaffRestaurantId
            : reportType === "restaurant"
            ? selectedRestaurantId
            : undefined,
          start,
          end,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      return (await res.json()).rows as ReportData[];
    },
    onSuccess: (data) => {
      setReportData(data);
      if (!data.length) toast.info("No data found for the selected period");
    },
    onError: () => toast.error("Failed to generate report"),
  });

  // ─── CSV / PDF / Excel export (in-browser results) ────────────────────────

  const exportContext = {
    period: { start, end },
    reportType,
    restaurantName: restaurants?.find((r) => r.id === selectedRestaurantId)?.name,
    generatedBy: auth?.name,
  };

  function handleExportCSV() {
    if (!reportData.length) return;
    const headers = [
      "Staff", "Total Hours", "Regular Hrs", "Overtime Hrs",
      "Rate (HKD)", "Gross Earnings", "Leave Pay", "Total Payable", "Leave Days",
    ];
    const rows = reportData.map((r) => [
      r.staffName, r.totalHours.toFixed(2), r.regularHours.toFixed(2),
      r.overtimeHours.toFixed(2), r.hourlyRate.toFixed(2),
      r.grossEarnings.toFixed(2), r.leavePayments.toFixed(2),
      r.totalPayable.toFixed(2), r.leaveDays,
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
  }

  function handleExportPDF() {
    if (!reportData.length) return;
    try {
      exportReportPDF({ reportData, ...exportContext });
      toast.success("PDF exported");
    } catch {
      toast.error("Failed to export PDF");
    }
  }

  function handleExportExcel() {
    if (!reportData.length) return;
    try {
      exportReportExcel({ reportData, ...exportContext });
      toast.success("Excel exported");
    } catch {
      toast.error("Failed to export Excel");
    }
  }

  // ─── Part-Time 5-page export ──────────────────────────────────────────────

  async function handlePTExport(exportFormat: "PDF" | "EXCEL") {
    const isAllStaff = reportType === "individual" && selectedStaffId === "__ALL__";
    const targetRestaurantId =
      reportType === "restaurant"
        ? selectedRestaurantId
        : isAllStaff && auth?.role === "SUPER_ADMIN"
        ? selectedRestaurantId
        : (auth?.restaurantId ?? "");

    if (!targetRestaurantId) {
      toast.error("Please select a restaurant before exporting");
      return;
    }

    setIsExporting(true);
    try {
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: targetRestaurantId,
          startDate: start,
          endDate: end,
          employmentType: "PART_TIME",
          format: exportFormat,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Export failed");
        return;
      }

      const payload = json as PTExportPayload;
      if (exportFormat === "PDF") {
        exportPTReportPDF(payload);
        toast.success("Part-Time PDF exported (5 pages)");
      } else {
        exportPTReportExcel(payload);
        toast.success("Part-Time Excel exported (5 sheets)");
      }
    } catch {
      toast.error("Export failed — check your connection");
    } finally {
      setIsExporting(false);
    }
  }

  // ─── Dropdown options ─────────────────────────────────────────────────────

  const reportTypeOptions = [
    { value: "restaurant", label: "All Staff (Restaurant)" },
    { value: "individual", label: "Individual Staff" },
    ...(auth?.role === "SUPER_ADMIN"
      ? [{ value: "all", label: "All Restaurants" }]
      : []),
  ];

  const periodOptions = [
    { value: "monthly", label: "Last Month" },
    { value: "weekly", label: "This Week" },
    { value: "custom", label: "Custom Range" },
  ];

  const employmentTypeOptions = [
    { value: "PART_TIME",  label: "Part-Time (Weekly)" },
    { value: "FULL_TIME",  label: "Full-Time (Monthly Payslip)" },
  ];

  const staffOptions = [
    { value: "", label: "— Select staff member —" },
    { value: "__ALL__", label: "All Staff" },
    ...(staff?.map((s) => ({ value: s.id, label: s.name })) || []),
  ];

  const restaurantOptions = [
    { value: "", label: "— Select restaurant —" },
    ...(restaurants?.map((r) => ({ value: r.id, label: r.name })) || []),
  ];

  // ─── Derived state ────────────────────────────────────────────────────────

  const isAllStaff = reportType === "individual" && selectedStaffId === "__ALL__";
  const showRestaurantPicker =
    reportType === "restaurant" ||
    (isAllStaff && auth?.role === "SUPER_ADMIN");
  const showStaffPicker = reportType === "individual";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Loading overlay ───────────────────────────────────────────── */}
      {isExporting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
          }}
        >
          <Loader2
            size={44}
            color="#F5A623"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p style={{ color: "#E8E8E8", fontSize: "16px", fontWeight: 600, margin: 0 }}>
            Generating Part-Time Export...
          </p>
          <p style={{ color: "#A1A1AA", fontSize: "13px", margin: 0 }}>
            Building 5-page payroll report — please wait
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Page title ───────────────────────────────────────────────── */}
      <div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#E8E8E8" }}>
          Reports
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#52525B" }}>
          Generate payroll &amp; attendance reports for your restaurant
        </p>
      </div>

      {/* ── Report Configuration ──────────────────────────────────────── */}
      <Card>
        <CardHeader title="Report Configuration" icon={<BarChart3 size={14} />} />
        <CardBody>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Row 1: selectors */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                gap: "12px",
              }}
            >
              <Select
                label="Report Type"
                options={reportTypeOptions}
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as ReportType);
                  setSelectedStaffId("");
                }}
              />
              <Select
                label="Period"
                options={periodOptions}
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
              />
              <Select
                label="Employment Type"
                options={employmentTypeOptions}
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              />
              {showStaffPicker && (
                <Select
                  label="Staff Member"
                  options={staffOptions}
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                />
              )}
              {showRestaurantPicker && (
                <Select
                  label="Restaurant"
                  options={restaurantOptions}
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                />
              )}
            </div>

            {/* Custom date range */}
            {period === "custom" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  maxWidth: "400px",
                }}
              >
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

            {/* Generate button */}
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
                {start} → {end}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Part-Time Export (always visible when PART_TIME selected) ─── */}
      {employmentType === "PART_TIME" && (
        <Card>
          <CardHeader
            title="Part-Time Payroll Export"
            subtitle="Weekly-based calculation · Mon–Sun grouping · HK 44hr OT threshold · HK Employment Ordinance compliant"
            icon={<FileSpreadsheet size={14} />}
          />
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* What's inside */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: "8px",
                }}
              >
                {[
                  { n: "1", label: "Salary Summary", desc: "Net pay per staff + Grand Total" },
                  { n: "2", label: "Attendance Grid", desc: "F / OFF / SH / AL / SL per day" },
                  { n: "3", label: "Deduction Sheet", desc: "SL · AL · UPL · Absent" },
                  { n: "4", label: "Bank Transfer", desc: "Account & salary per staff" },
                  { n: "5", label: "Weekly Petty Cash", desc: "Day-by-day pay breakdown" },
                ].map((p) => (
                  <div
                    key={p.n}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#1A1A1E",
                      border: "1px solid #27272A",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          backgroundColor: "#F5A623",
                          color: "#0A0A0B",
                          fontSize: "10px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {p.n}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#E8E8E8" }}>
                        {p.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "11px", color: "#52525B" }}>{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* Export buttons */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <Button
                  variant="primary"
                  onClick={() => handlePTExport("PDF")}
                  disabled={isExporting}
                  iconLeft={<FileText size={15} />}
                >
                  Export PDF — 5 Pages
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handlePTExport("EXCEL")}
                  disabled={isExporting}
                  iconLeft={<FileSpreadsheet size={15} />}
                >
                  Export Excel — 5 Sheets
                </Button>
                <span style={{ fontSize: "11px", color: "#52525B" }}>
                  Only Part-Time staff included · Select Restaurant or period above first
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Monthly Payslip Generator (All Staff) ─────────────────── */}
      {
        <Card>
          <CardHeader
            title="Monthly Payslip Generator"
            subtitle="Generates printable PDF payslips · 3 per A4 page · Full-Time & Part-Time staff · HK MPF included"
            icon={<FileDown size={14} />}
          />
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Feature pills */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: "8px",
                }}
              >
                {[
                  { n: "1", label: "Staff Info",     desc: "Name · No. · Position · Hire Date" },
                  { n: "2", label: "Additions",      desc: "Basic Salary · Food Allow. · OT" },
                  { n: "3", label: "Deductions",     desc: "No Pay Leave · MPF (5% capped HK$1,500)" },
                  { n: "4", label: "Net Total",      desc: "Highlighted in yellow per slip" },
                  { n: "5", label: "Bank Details",   desc: "HSBC account · Autopay date" },
                ].map((p) => (
                  <div
                    key={p.n}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#1A1A1E",
                      border: "1px solid #27272A",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          backgroundColor: "#F5A623",
                          color: "#0A0A0B",
                          fontSize: "10px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {p.n}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#E8E8E8" }}>{p.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "11px", color: "#52525B" }}>{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                  gap: "12px",
                  alignItems: "flex-end",
                }}
              >
                {/* Month picker */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Payroll Month
                  </label>
                  <input
                    type="month"
                    value={payslipMonth}
                    onChange={(e) => setPayslipMonth(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      background: "#1A1A1E",
                      border: "1px solid #27272A",
                      borderRadius: "8px",
                      color: "#E8E8E8",
                      fontSize: "13px",
                      outline: "none",
                      colorScheme: "dark",
                    }}
                  />
                </div>

                {/* Restaurant picker — only for SUPER_ADMIN */}
                {auth?.role === "SUPER_ADMIN" && (
                  <Select
                    label="Restaurant"
                    options={restaurantOptions}
                    value={payslipRestaurantId}
                    onChange={(e) => setPayslipRestaurantId(e.target.value)}
                  />
                )}

                {/* Staff type filter */}
                <Select
                  label="Staff Type"
                  options={[
                    { value: "ALL",       label: "All Staff (FT + PT)" },
                    { value: "FULL_TIME", label: "Full-Time Only" },
                    { value: "PART_TIME", label: "Part-Time Only" },
                  ]}
                  value={payslipStaffType}
                  onChange={(e) => setPayslipStaffType(e.target.value as "ALL" | "FULL_TIME" | "PART_TIME")}
                />
              </div>

              {/* Generate button */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <Button
                  variant="primary"
                  onClick={async () => {
                    const targetRestId =
                      auth?.role === "SUPER_ADMIN" ? payslipRestaurantId : (auth?.restaurantId ?? "");
                    if (!targetRestId) {
                      toast.error("Please select a restaurant first");
                      return;
                    }
                    if (!payslipMonth) {
                      toast.error("Please select a payroll month");
                      return;
                    }
                    setIsGeneratingPayslip(true);
                    try {
                      const res = await fetch("/api/reports/payslip", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          restaurantId: targetRestId,
                          month: payslipMonth,
                          staffType: payslipStaffType === "ALL" ? undefined : payslipStaffType,
                        }),
                      });
                      const json = await res.json();
                      if (!res.ok) {
                        toast.error(json.error || "Failed to generate payslips");
                        return;
                      }
                      exportPayslipPDF(json);
                      toast.success(`Payslips PDF downloaded — ${json.payslips?.length ?? 0} staff`);
                    } catch {
                      toast.error("Failed to generate payslips");
                    } finally {
                      setIsGeneratingPayslip(false);
                    }
                  }}
                  disabled={isGeneratingPayslip}
                  loading={isGeneratingPayslip}
                  iconLeft={<FileDown size={15} />}
                >
                  Generate & Download Payslips PDF
                </Button>
                <span style={{ fontSize: "11px", color: "#52525B" }}>
                  All active staff · PDF opens automatically
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      }


      {/* ── In-browser report results ─────────────────────────────────── */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader
            title="Report Results"
            subtitle={`${reportData.length} staff · ${start} to ${end}`}
            icon={<FileText size={14} />}
            action={
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCSV}
                  iconLeft={<Download size={13} />}
                >
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportExcel}
                  iconLeft={<FileSpreadsheet size={13} />}
                >
                  Excel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportPDF}
                  iconLeft={<FileText size={13} />}
                >
                  PDF
                </Button>
              </div>
            }
          />
          <CardBody padding={false}>
            {/* Summary bar */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                padding: "14px 20px",
                backgroundColor: "rgba(245,166,35,0.05)",
                borderBottom: "1px solid #27272A",
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  label: "Total Hours",
                  value: reportData.reduce((s, r) => s + r.totalHours, 0).toFixed(1) + "h",
                },
                {
                  label: "Total Payable",
                  value: "HK$ " + reportData.reduce((s, r) => s + r.totalPayable, 0).toFixed(2),
                },
                {
                  label: "Leave Days",
                  value: reportData.reduce((s, r) => s + r.leaveDays, 0) + " days",
                },
              ].map((item) => (
                <div key={item.label}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      color: "#52525B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {item.label}
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: "18px", fontWeight: 700, color: "#F5A623" }}>
                    {item.value}
                  </p>
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
              {["Staff", "Total Hrs", "Regular", "Overtime", "Rate", "Gross", "Total Payable"].map(
                (h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#52525B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </span>
                )
              )}
            </div>

            {/* Rows */}
            {reportData.map((row, i) => (
              <div
                key={row.staffId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
                  padding: "13px 20px",
                  borderBottom: i < reportData.length - 1 ? "1px solid #1A1A1E" : undefined,
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Avatar name={row.staffName} size="sm" />
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#E8E8E8" }}>
                    {row.staffName}
                  </span>
                </div>
                <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                  {row.totalHours.toFixed(1)}h
                </span>
                <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                  {row.regularHours.toFixed(1)}h
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: row.overtimeHours > 0 ? "#F5A623" : "#A1A1AA",
                    fontWeight: row.overtimeHours > 0 ? 600 : 400,
                  }}
                >
                  {row.overtimeHours.toFixed(1)}h
                </span>
                <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                  HK${row.hourlyRate.toFixed(0)}
                </span>
                <span style={{ fontSize: "13px", color: "#A1A1AA" }}>
                  HK${row.grossEarnings.toFixed(0)}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#22C55E" }}>
                  HK${row.totalPayable.toFixed(0)}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!reportData.length && !generating && (
        <EmptyState
          icon={<BarChart3 size={22} />}
          title="No report generated yet"
          description='Select your configuration above and click "Generate Report" to view data, or use the Part-Time Export buttons to download a full payroll file.'
        />
      )}
    </div>
  );
}
