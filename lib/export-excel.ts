import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { ReportRow } from "./export-pdf";

export interface ExportExcelOptions {
  reportData: ReportRow[];
  period: { start: string; end: string };
  reportType: "individual" | "restaurant" | "all";
  restaurantName?: string;
  generatedBy?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hkd(n: number) {
  return Number(n.toFixed(2));
}

function genRef() {
  const ts = format(new Date(), "yyyyMMdd");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AHR-${ts}-${rand}`;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportReportExcel(opts: ExportExcelOptions) {
  const { reportData, period, reportType, restaurantName, generatedBy } = opts;
  const refNum = genRef();

  const reportTypeLabel =
    reportType === "individual"
      ? "Individual Staff Report"
      : reportType === "restaurant"
        ? `Restaurant Report${restaurantName ? ` — ${restaurantName}` : ""}`
        : "All Restaurants Report";

  const periodLabel = `${format(new Date(period.start), "d MMM yyyy")} – ${format(new Date(period.end), "d MMM yyyy")}`;

  // ── Totals ─────────────────────────────────────────────────────────────────
  const sumHours   = reportData.reduce((s, r) => s + r.totalHours, 0);
  const sumRegular = reportData.reduce((s, r) => s + r.regularHours, 0);
  const sumOT      = reportData.reduce((s, r) => s + r.overtimeHours, 0);
  const sumGross   = reportData.reduce((s, r) => s + r.grossEarnings, 0);
  const sumLeave   = reportData.reduce((s, r) => s + r.leavePayments, 0);
  const sumPayable = reportData.reduce((s, r) => s + r.totalPayable, 0);
  const sumDays    = reportData.reduce((s, r) => s + r.leaveDays, 0);

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 1 — REPORT
  // ─────────────────────────────────────────────────────────────────────────────

  const reportSheet: (string | number | null)[][] = [];

  // Title block
  reportSheet.push(["AMAZONIA HR MANAGEMENT SYSTEM"]);
  reportSheet.push(["PAYROLL AUDIT REPORT"]);
  reportSheet.push([null]);

  // Metadata
  reportSheet.push(["Report Type",  reportTypeLabel, null, "Reference",       refNum]);
  reportSheet.push(["Audit Period", periodLabel,     null, "Generated",       format(new Date(), "d MMM yyyy, HH:mm")]);
  reportSheet.push(["Prepared By",  generatedBy || "System", null, "Classification", "CONFIDENTIAL"]);
  reportSheet.push([null]);

  // Summary header
  reportSheet.push(["SUMMARY"]);
  reportSheet.push(["Metric", "Value"]);
  reportSheet.push(["Total Staff",   reportData.length]);
  reportSheet.push(["Total Hours",   hkd(sumHours)]);
  reportSheet.push(["Regular Hours", hkd(sumRegular)]);
  reportSheet.push(["Overtime Hours",hkd(sumOT)]);
  reportSheet.push(["Gross Earnings (HKD)", hkd(sumGross)]);
  reportSheet.push(["Leave Payments (HKD)", hkd(sumLeave)]);
  reportSheet.push(["Total Payable (HKD)",  hkd(sumPayable)]);
  reportSheet.push(["Total Leave Days",     sumDays]);
  reportSheet.push([null]);

  // Detail header
  const HEADER_ROW = reportSheet.length; // 0-indexed track for styling
  reportSheet.push([
    "Staff Member",
    "Total Hours",
    "Regular Hours",
    "Overtime Hours",
    "Hourly Rate (HKD)",
    "Gross Earnings (HKD)",
    "Leave Pay (HKD)",
    "Total Payable (HKD)",
    "Leave Days",
  ]);

  // Data rows
  reportData.forEach((r) => {
    reportSheet.push([
      r.staffName,
      hkd(r.totalHours),
      hkd(r.regularHours),
      hkd(r.overtimeHours),
      hkd(r.hourlyRate),
      hkd(r.grossEarnings),
      hkd(r.leavePayments),
      hkd(r.totalPayable),
      r.leaveDays,
    ]);
  });

  // Totals row
  reportSheet.push([
    "TOTALS",
    hkd(sumHours),
    hkd(sumRegular),
    hkd(sumOT),
    null,
    hkd(sumGross),
    hkd(sumLeave),
    hkd(sumPayable),
    sumDays,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(reportSheet);

  // Column widths
  ws["!cols"] = [
    { wch: 28 }, // A — Staff / label
    { wch: 14 }, // B
    { wch: 15 }, // C
    { wch: 15 }, // D
    { wch: 20 }, // E
    { wch: 22 }, // F
    { wch: 20 }, // G
    { wch: 22 }, // H
    { wch: 13 }, // I
  ];

  // Merge title cells A1:I1 and A2:I2
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 8 } }, // SUMMARY label
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 2 — METADATA
  // ─────────────────────────────────────────────────────────────────────────────

  const metaSheet: (string | number)[][] = [
    ["Field", "Value"],
    ["Document Title",   "Payroll Audit Report"],
    ["Organisation",     "Amazonia HR Management"],
    ["Reference Number", refNum],
    ["Report Type",      reportTypeLabel],
    ["Audit Period",     periodLabel],
    ["Start Date",       format(new Date(period.start), "d MMM yyyy")],
    ["End Date",         format(new Date(period.end), "d MMM yyyy")],
    ["Generated At",     format(new Date(), "d MMM yyyy, HH:mm")],
    ["Prepared By",      generatedBy || "System"],
    ["Staff Count",      reportData.length],
    ["Classification",   "CONFIDENTIAL"],
    ["System",           "Amazonia HR v1.0"],
  ];

  const wsMeta = XLSX.utils.aoa_to_sheet(metaSheet);
  wsMeta["!cols"] = [{ wch: 22 }, { wch: 45 }];

  // ─────────────────────────────────────────────────────────────────────────────
  // WORKBOOK
  // ─────────────────────────────────────────────────────────────────────────────

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws,     "Payroll Report");
  XLSX.utils.book_append_sheet(wb, wsMeta, "Report Metadata");

  const filename = `amazonia-payroll-${reportType}-${format(new Date(period.start), "yyyyMM")}-${format(new Date(), "yyyyMMdd")}.xlsx`;
  XLSX.writeFile(wb, filename);
}
