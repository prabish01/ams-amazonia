import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO, eachDayOfInterval } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PTWeekData {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  leavePay: number;
  netPay: number;
  dailyHours: Record<string, number>;
}

export interface PTStaffData {
  staffId: string;
  staffName: string;
  nickname?: string | null;
  position: string;
  hireDate: string;
  hourlyRate: number;
  shEligible?: boolean;
  hkid?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  bankAccountNumber?: string | null;
  attendanceDates: Record<string, string>;
  leaveSummary: { sh: number; al: number; sl: number; upl: number };
  weeks: PTWeekData[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  leavePay: number;
  deductions: number;
  netPay: number;
}

export interface PTExportPayload {
  period: { start: string; end: string };
  restaurantName: string;
  generatedBy?: string;
  staff: PTStaffData[];
  weeks: { weekStart: string; weekEnd: string }[];
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  headerBg:   [24, 24, 27]       as [number, number, number],
  gold:       [212, 140, 28]     as [number, number, number],
  goldLight:  [245, 166, 35]     as [number, number, number],
  white:      [255, 255, 255]    as [number, number, number],
  offWhite:   [250, 250, 250]    as [number, number, number],
  rowAlt:     [245, 245, 247]    as [number, number, number],
  totalsBg:   [24, 24, 27]       as [number, number, number],
  border:     [220, 220, 225]    as [number, number, number],
  textDark:   [30, 30, 35]       as [number, number, number],
  textMid:    [100, 100, 110]    as [number, number, number],
  textLight:  [155, 155, 165]    as [number, number, number],
  green:      [22, 163, 74]      as [number, number, number],
  greenBg:    [220, 252, 231]    as [number, number, number],
  amber:      [180, 83, 9]       as [number, number, number],
  red:        [220, 38, 38]      as [number, number, number],
  redBg:      [254, 226, 226]    as [number, number, number],
  blue:       [59, 130, 246]     as [number, number, number],
  blueBg:     [219, 234, 254]    as [number, number, number],
  yellow:     [161, 98, 7]       as [number, number, number],
  yellowBg:   [254, 249, 195]    as [number, number, number],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compact HKD — rounded, no decimals. "HK$1,234" */
function hkd(n: number) {
  return `HK$${Math.round(n).toLocaleString("en-HK")}`;
}

/** Hours display — 1 decimal */
function hrs(n: number) {
  return `${n.toFixed(1)}h`;
}

function genRef() {
  const ts = format(new Date(), "yyyyMMdd");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AHR-PT-${ts}-${rand}`;
}

// ─── Page header & footer (shared) ───────────────────────────────────────────

function drawHeader(doc: jsPDF, title: string, sub: string, ref: string, pageLabel: string) {
  const PW = doc.internal.pageSize.getWidth();
  const ML = 12;

  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, PW, 20, "F");
  doc.setFillColor(...C.gold);
  doc.rect(0, 0, 3, 20, "F");
  doc.setFillColor(...C.goldLight);
  doc.rect(0, 20, PW, 0.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.gold);
  doc.text("AMAZONIA", ML + 3, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.textLight);
  doc.text("HR MANAGEMENT SYSTEM", ML + 3, 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.white);
  doc.text(title, PW - ML, 8, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.textLight);
  doc.text(sub, PW - ML, 13, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...C.gold);
  doc.text(`${pageLabel}  ·  Ref: ${ref}  ·  CONFIDENTIAL`, PW - ML, 18, { align: "right" });
}

function drawFooter(doc: jsPDF, pageNum: number, ref: string) {
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const y = PH - 6;

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(12, y - 2, PW - 12, y - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...C.textMid);
  doc.text("AMAZONIA HR  ·  CONFIDENTIAL  ·  AUTHORISED USE ONLY", 12, y);
  doc.text(`Ref: ${ref}`, PW / 2, y, { align: "center" });
  doc.text(`Page ${pageNum}`, PW - 12, y, { align: "right" });

  doc.setFillColor(...C.gold);
  doc.rect(0, PH - 1, PW, 1, "F");
}

// ─── Shared table style defaults ──────────────────────────────────────────────

function baseStyles() {
  return {
    fontSize: 7.5,
    cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
    textColor: C.textDark,
    lineColor: C.border,
    lineWidth: 0.18,
    font: "helvetica" as const,
    overflow: "ellipsize" as const,
  };
}

function headStyles() {
  return {
    fillColor: C.headerBg,
    textColor: C.white,
    fontStyle: "bold" as const,
    fontSize: 7,
    cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    overflow: "ellipsize" as const,
  };
}

// ─── Page 1 — Salary Summary ──────────────────────────────────────────────────
// Landscape A4: 297mm wide − 24mm margins = 273mm content

function renderSalarySummary(
  doc: jsPDF,
  payload: PTExportPayload,
  ref: string,
  pg: { n: number }
) {
  const { staff, period, restaurantName, generatedBy } = payload;
  const ML = 12;

  drawHeader(
    doc,
    "PART-TIME PAYROLL REPORT",
    `${restaurantName}  ·  ${format(parseISO(period.start), "d MMM")}–${format(parseISO(period.end), "d MMM yyyy")}  ·  ${generatedBy || "System"}`,
    ref,
    "1 / 5  —  Salary Summary"
  );

  const colHeaders = [
    "Staff Name", "Position", "Total Hrs", "Reg Hrs", "OT Hrs",
    "Rate /hr", "Gross Pay", "Leave Pay", "Deductions", "Net Pay",
  ];

  const rows = staff.map((s) => [
    s.staffName,
    s.position,
    hrs(s.totalHours),
    hrs(s.regularHours),
    hrs(s.overtimeHours),
    hkd(s.hourlyRate),
    hkd(s.grossPay),
    hkd(s.leavePay),
    s.deductions > 0 ? hkd(s.deductions) : "—",
    hkd(s.netPay),
  ]);

  const totalsRow = [
    "GRAND TOTAL", "",
    hrs(staff.reduce((s, r) => s + r.totalHours, 0)),
    hrs(staff.reduce((s, r) => s + r.regularHours, 0)),
    hrs(staff.reduce((s, r) => s + r.overtimeHours, 0)),
    "—",
    hkd(staff.reduce((s, r) => s + r.grossPay, 0)),
    hkd(staff.reduce((s, r) => s + r.leavePay, 0)),
    hkd(staff.reduce((s, r) => s + r.deductions, 0)),
    hkd(staff.reduce((s, r) => s + r.netPay, 0)),
  ];

  autoTable(doc, {
    head: [colHeaders],
    body: [...rows, totalsRow],
    startY: 26,
    margin: { left: ML, right: ML },
    tableLineColor: C.border,
    tableLineWidth: 0.2,
    styles: baseStyles(),
    headStyles: headStyles(),
    alternateRowStyles: { fillColor: C.rowAlt },
    // Column widths — landscape 297mm, content 273mm
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold", overflow: "ellipsize" },
      1: { cellWidth: 28, overflow: "ellipsize" },
      2: { cellWidth: 20, halign: "right" },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 28, halign: "right" },
      7: { cellWidth: 26, halign: "right" },
      8: { cellWidth: 26, halign: "right" },
      9: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    didParseCell(data) {
      const isTotal = data.row.index === rows.length;
      if (isTotal) {
        data.cell.styles.fillColor = C.totalsBg;
        data.cell.styles.textColor = C.white;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 9 && data.row.section === "body" && !isTotal) {
        data.cell.styles.textColor = C.green;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 4 && data.row.section === "body" && !isTotal) {
        const val = parseFloat(String(staff[data.row.index]?.overtimeHours || 0));
        if (val > 0) data.cell.styles.textColor = C.amber;
      }
    },
    didDrawPage() { pg.n++; drawFooter(doc, pg.n, ref); },
  });
}

// ─── Page 2 — Attendance Grid ─────────────────────────────────────────────────
// Landscape A4: dynamic day columns, small font, colour-coded cells

function renderAttendanceGrid(
  doc: jsPDF,
  payload: PTExportPayload,
  ref: string,
  pg: { n: number }
) {
  const { staff, period, restaurantName } = payload;
  const ML = 10;

  drawHeader(
    doc,
    "ATTENDANCE SCHEDULE",
    `${restaurantName}  ·  ${format(parseISO(period.start), "d MMM")}–${format(parseISO(period.end), "d MMM yyyy")}`,
    ref,
    "2 / 5  —  Attendance Grid"
  );

  const allDays = eachDayOfInterval({
    start: parseISO(period.start),
    end: parseISO(period.end),
  });

  const PW = doc.internal.pageSize.getWidth();
  const contentW = PW - ML * 2;
  const nameColW = 34;
  const summaryColW = 9; // SH, AL, SL columns
  const summaryCols = 3;
  const dayColW = Math.max(
    5.5,
    (contentW - nameColW - summaryColW * summaryCols) / allDays.length
  );

  const colHeaders = [
    "Staff Name",
    ...allDays.map((d) => format(d, "d")),
    "SH", "AL", "SL",
  ];

  const rows = staff.map((s) => [
    s.staffName,
    ...allDays.map((d) => s.attendanceDates[format(d, "yyyy-MM-dd")] || "—"),
    String(s.leaveSummary.sh),
    String(s.leaveSummary.al),
    String(s.leaveSummary.sl),
  ]);

  // Build column styles dynamically
  const colStyles: Record<number, object> = {
    0: { cellWidth: nameColW, fontStyle: "bold", overflow: "ellipsize" },
  };
  for (let i = 1; i <= allDays.length; i++) {
    colStyles[i] = { cellWidth: dayColW, halign: "center", overflow: "ellipsize" };
  }
  const sumBase = allDays.length + 1;
  colStyles[sumBase]     = { cellWidth: summaryColW, halign: "center", fontStyle: "bold" };
  colStyles[sumBase + 1] = { cellWidth: summaryColW, halign: "center", fontStyle: "bold" };
  colStyles[sumBase + 2] = { cellWidth: summaryColW, halign: "center", fontStyle: "bold" };

  autoTable(doc, {
    head: [colHeaders],
    body: rows,
    startY: 26,
    margin: { left: ML, right: ML },
    tableLineColor: C.border,
    tableLineWidth: 0.15,
    styles: {
      ...baseStyles(),
      fontSize: 6,
      cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
    },
    headStyles: {
      ...headStyles(),
      fontSize: 6,
      cellPadding: { top: 2.5, bottom: 2.5, left: 1, right: 1 },
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: colStyles,
    didParseCell(data) {
      if (data.row.section !== "body") return;
      const val = String(data.cell.raw);
      if (val === "F") {
        data.cell.styles.fillColor = C.greenBg;
        data.cell.styles.textColor = C.green;
        data.cell.styles.fontStyle = "bold";
      } else if (val === "SH") {
        data.cell.styles.fillColor = C.blueBg;
        data.cell.styles.textColor = C.blue;
        data.cell.styles.fontStyle = "bold";
      } else if (val === "AL") {
        data.cell.styles.fillColor = C.yellowBg;
        data.cell.styles.textColor = C.yellow;
        data.cell.styles.fontStyle = "bold";
      } else if (val === "SL") {
        data.cell.styles.fillColor = C.redBg;
        data.cell.styles.textColor = C.red;
        data.cell.styles.fontStyle = "bold";
      }
    },
    didDrawPage() { pg.n++; drawFooter(doc, pg.n, ref); },
  });
}

// ─── Page 3 — Staff Deduction Sheet ──────────────────────────────────────────
// Portrait A4: 210mm − 24mm = 186mm content

function renderDeductionSheet(
  doc: jsPDF,
  payload: PTExportPayload,
  ref: string,
  pg: { n: number }
) {
  const { staff, period, restaurantName } = payload;
  const ML = 12;

  drawHeader(
    doc,
    "STAFF DEDUCTION SHEET",
    `${restaurantName}  ·  ${format(parseISO(period.start), "d MMM")}–${format(parseISO(period.end), "d MMM yyyy")}`,
    ref,
    "3 / 5  —  Deductions"
  );

  const colHeaders = [
    "S.N.", "Staff Name", "HKID", "Commencement", "Position", "Deduction Reason", "Days to Pay",
  ];

  const rows = staff.map((s, i) => {
    const reasons: string[] = [];
    if (s.leaveSummary.sl > 0)  reasons.push(`SL ×${s.leaveSummary.sl}`);
    if (s.leaveSummary.upl > 0) reasons.push(`UPL ×${s.leaveSummary.upl}`);
    const offDays = Object.values(s.attendanceDates).filter((c) => c === "OFF").length;
    if (offDays > 0) reasons.push(`Absent ×${offDays}`);
    const workedDays = Object.values(s.attendanceDates).filter((c) => c === "F").length;

    return [
      String(i + 1),
      s.staffName,
      s.hkid || "N/A",
      format(parseISO(s.hireDate), "d MMM yyyy"),
      s.position,
      reasons.length ? reasons.join(", ") : "—",
      String(workedDays),
    ];
  });

  autoTable(doc, {
    head: [colHeaders],
    body: rows,
    startY: 26,
    margin: { left: ML, right: ML },
    tableLineColor: C.border,
    tableLineWidth: 0.2,
    styles: baseStyles(),
    headStyles: headStyles(),
    alternateRowStyles: { fillColor: C.rowAlt },
    // Portrait 210mm − 24mm = 186mm
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 36, fontStyle: "bold", overflow: "ellipsize" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 26, halign: "center" },
      4: { cellWidth: 28, overflow: "ellipsize" },
      5: { cellWidth: 50, overflow: "linebreak" },
      6: { cellWidth: 16, halign: "center", fontStyle: "bold" },
    },
    didParseCell(data) {
      if (data.row.section !== "body") return;
      if (data.column.index === 5 && data.cell.raw !== "—") {
        data.cell.styles.textColor = C.red;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = C.redBg;
      }
    },
    didDrawPage() { pg.n++; drawFooter(doc, pg.n, ref); },
  });
}

// ─── Page 4 — Bank Transfer Sheet ────────────────────────────────────────────
// Landscape A4: 273mm content, 12 columns

function renderBankTransferSheet(
  doc: jsPDF,
  payload: PTExportPayload,
  ref: string,
  pg: { n: number }
) {
  const { staff, period, restaurantName } = payload;
  const ML = 10;

  drawHeader(
    doc,
    "BANK TRANSFER SHEET",
    `${restaurantName}  ·  ${format(parseISO(period.start), "d MMM")}–${format(parseISO(period.end), "d MMM yyyy")}`,
    ref,
    "4 / 5  —  Bank Transfer"
  );

  const colHeaders = [
    "Staff Name", "Nickname", "Position", "HKID",
    "Full Salary", "Days", "OT Hrs", "Rate /hr",
    "Joined", "Bank", "Code", "Account No.",
  ];

  const rows = staff.map((s) => {
    const workedDays = Object.values(s.attendanceDates).filter((c) => c === "F").length;
    return [
      s.staffName,
      s.nickname || s.staffName.split(" ")[0],
      s.position,
      s.hkid || "N/A",
      hkd(s.netPay),
      String(workedDays),
      hrs(s.overtimeHours),
      hkd(s.hourlyRate),
      format(parseISO(s.hireDate), "d/M/yy"),
      s.bankName || "N/A",
      s.bankCode || "N/A",
      s.bankAccountNumber || "N/A",
    ];
  });

  autoTable(doc, {
    head: [colHeaders],
    body: rows,
    startY: 26,
    margin: { left: ML, right: ML },
    tableLineColor: C.border,
    tableLineWidth: 0.18,
    styles: { ...baseStyles(), fontSize: 7 },
    headStyles: { ...headStyles(), fontSize: 7 },
    alternateRowStyles: { fillColor: C.rowAlt },
    // Landscape 277mm content
    columnStyles: {
      0:  { cellWidth: 34, fontStyle: "bold", overflow: "ellipsize" },
      1:  { cellWidth: 20, overflow: "ellipsize" },
      2:  { cellWidth: 26, overflow: "ellipsize" },
      3:  { cellWidth: 18, halign: "center" },
      4:  { cellWidth: 26, halign: "right", fontStyle: "bold" },
      5:  { cellWidth: 14, halign: "center" },
      6:  { cellWidth: 16, halign: "right" },
      7:  { cellWidth: 20, halign: "right" },
      8:  { cellWidth: 18, halign: "center" },
      9:  { cellWidth: 22, overflow: "ellipsize" },
      10: { cellWidth: 14, halign: "center" },
      11: { cellWidth: 24, halign: "center" },
    },
    didParseCell(data) {
      if (data.column.index === 4 && data.row.section === "body") {
        data.cell.styles.textColor = C.green;
      }
    },
    didDrawPage() { pg.n++; drawFooter(doc, pg.n, ref); },
  });
}

// ─── Page 5 — Weekly Petty Cash ───────────────────────────────────────────────
// Landscape A4: Name + Position + Rate + PerDay + Mon–Sun + Total

function renderWeeklyPettyCash(
  doc: jsPDF,
  payload: PTExportPayload,
  ref: string,
  pg: { n: number }
) {
  const { staff, period, restaurantName, weeks } = payload;
  const ML = 10;

  drawHeader(
    doc,
    "WEEKLY PETTY CASH",
    `${restaurantName}  ·  ${format(parseISO(period.start), "d MMM")}–${format(parseISO(period.end), "d MMM yyyy")}  ·  Part-Time Only`,
    ref,
    "5 / 5  —  Weekly Petty Cash"
  );

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const colHeaders = ["Name", "Position", "Rate /hr", "Day Rate", ...DAY_LABELS, "Week Total"];

  const tableRows: (string | number)[][] = [];

  for (const week of weeks) {
    const ws = parseISO(week.weekStart);
    const we = parseISO(week.weekEnd);
    const weekDays = eachDayOfInterval({ start: ws, end: we });
    const weekLabel = `WEEK  ${format(ws, "d MMM")} – ${format(we, "d MMM yyyy")}`;

    // Week header row (12 cells total)
    tableRows.push([weekLabel, "", "", "", "", "", "", "", "", "", "", ""]);

    for (const s of staff) {
      const sw = s.weeks.find((w) => w.weekStart === week.weekStart);
      const dailyHours = sw?.dailyHours || {};
      const dayRate = s.hourlyRate * 8;

      const dayCells = weekDays.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const h = dailyHours[key] || 0;
        return h > 0 ? hkd(h * s.hourlyRate) : "—";
      });

      tableRows.push([
        s.staffName,
        s.position,
        hkd(s.hourlyRate),
        hkd(dayRate),
        ...dayCells,
        hkd(sw?.netPay || 0),
      ]);
    }

    // Week subtotal
    const weekTotal = staff.reduce((sum, s) => {
      const sw = s.weeks.find((w) => w.weekStart === week.weekStart);
      return sum + (sw?.netPay || 0);
    }, 0);
    tableRows.push(["SUBTOTAL", "", "", "", "", "", "", "", "", "", "", hkd(weekTotal)]);
  }

  autoTable(doc, {
    head: [colHeaders],
    body: tableRows,
    startY: 26,
    margin: { left: ML, right: ML },
    tableLineColor: C.border,
    tableLineWidth: 0.18,
    styles: { ...baseStyles(), fontSize: 7 },
    headStyles: { ...headStyles(), fontSize: 7 },
    alternateRowStyles: { fillColor: C.rowAlt },
    // Landscape 277mm: Name(32)+Pos(24)+Rate(20)+Day(20)+7×Mon-Sun(16ea)+Total(25)
    columnStyles: {
      0:  { cellWidth: 32, fontStyle: "bold", overflow: "ellipsize" },
      1:  { cellWidth: 24, overflow: "ellipsize" },
      2:  { cellWidth: 20, halign: "right" },
      3:  { cellWidth: 20, halign: "right" },
      4:  { cellWidth: 16, halign: "right" },
      5:  { cellWidth: 16, halign: "right" },
      6:  { cellWidth: 16, halign: "right" },
      7:  { cellWidth: 16, halign: "right" },
      8:  { cellWidth: 16, halign: "right" },
      9:  { cellWidth: 16, halign: "right" },
      10: { cellWidth: 16, halign: "right" },
      11: { cellWidth: 25, halign: "right", fontStyle: "bold" },
    },
    didParseCell(data) {
      if (data.row.section !== "body") return;
      const first = String(tableRows[data.row.index]?.[0] ?? "");
      if (first.startsWith("WEEK")) {
        data.cell.styles.fillColor = C.headerBg;
        data.cell.styles.textColor = C.goldLight;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 7.5;
      }
      if (first === "SUBTOTAL") {
        data.cell.styles.fillColor = C.totalsBg;
        data.cell.styles.textColor = C.white;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 11 && first !== "SUBTOTAL" && !first.startsWith("WEEK")) {
        data.cell.styles.textColor = C.green;
      }
    },
    didDrawPage() { pg.n++; drawFooter(doc, pg.n, ref); },
  });
}

// ─── Main export function ─────────────────────────────────────────────────────

export function exportPTReportPDF(payload: PTExportPayload) {
  const ref = genRef();
  const pg = { n: 0 };

  // All pages landscape — gives maximum column width for tabular data
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Page 1 — Salary Summary (landscape)
  renderSalarySummary(doc, payload, ref, pg);

  // Page 2 — Attendance Grid (landscape)
  doc.addPage("a4", "landscape");
  renderAttendanceGrid(doc, payload, ref, pg);

  // Page 3 — Deduction Sheet (portrait — fewer columns, portrait works well)
  doc.addPage("a4", "portrait");
  renderDeductionSheet(doc, payload, ref, pg);

  // Page 4 — Bank Transfer (landscape — 12 columns)
  doc.addPage("a4", "landscape");
  renderBankTransferSheet(doc, payload, ref, pg);

  // Page 5 — Weekly Petty Cash (landscape — day columns)
  doc.addPage("a4", "landscape");
  renderWeeklyPettyCash(doc, payload, ref, pg);

  const filename = `amazonia-pt-payroll-${format(parseISO(payload.period.start), "yyyyMM")}-${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(filename);
}
