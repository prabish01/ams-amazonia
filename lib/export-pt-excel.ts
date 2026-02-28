// @ts-ignore — xlsx-js-style is a style-enabled fork of SheetJS; types come from xlsx
import * as XLSX from "xlsx-js-style";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import type { PTExportPayload } from "./export-pt-pdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hkd(n: number): string {
  return `HK$${Math.round(n).toLocaleString("en-HK")}`;
}

function genRef() {
  const ts = format(new Date(), "yyyyMMdd");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AHR-PT-${ts}-${rand}`;
}

// ─── Color Palette ────────────────────────────────────────────────────────────

const C = {
  // Dark headers
  hdrBg: "1E293B",   hdrFg:  "F8FAFC",
  // Section sub-headers
  secBg: "334155",   secFg:  "E2E8F0",
  // Totals / grand total rows
  totBg: "0F172A",   totFg:  "F8FAFC",
  // Week subtotals
  subBg: "1E293B",   subFg:  "F8FAFC",
  // Week block headers (petty cash)
  wkBg:  "164E63",   wkFg:   "E0F2FE",
  // Attendance code backgrounds (light, for readability)
  fBg:   "DCFCE7",   fFg:    "166534",   // F  — worked
  shBg:  "DBEAFE",   shFg:   "1E40AF",   // SH — statutory holiday
  alBg:  "FEF9C3",   alFg:   "854D0E",   // AL — annual leave
  slBg:  "FEE2E2",   slFg:   "991B1B",   // SL — sick leave
  // Special value cells
  otBg:     "FEF3C7", otFg:     "92400E",  // OT hours — amber
  netBg:    "F0FDF4", netFg:    "166534",  // Net pay — green
  deductBg: "FEF2F2", deductFg: "991B1B",  // Deduction cell — red
  bankBg:   "F0FDF4", bankFg:   "166534",  // Bank amounts — green
};

// ─── Style Builder Types ──────────────────────────────────────────────────────

type XFill   = { patternType: "solid"; fgColor: { rgb: string } };
type XFont   = { bold?: boolean; sz?: number; color?: { rgb: string }; name?: string };
type XAlign  = { horizontal?: "left" | "center" | "right"; vertical?: "center"; wrapText?: boolean };
type XStyle  = { fill?: XFill; font?: XFont; alignment?: XAlign };

function fill(rgb: string): XFill {
  return { patternType: "solid", fgColor: { rgb } };
}

// ─── Pre-built Styles ─────────────────────────────────────────────────────────

const S = {
  hdr: (h: "left" | "center" | "right" = "left"): XStyle => ({
    fill: fill(C.hdrBg),
    font: { bold: true, color: { rgb: C.hdrFg }, sz: 11 },
    alignment: { horizontal: h, vertical: "center" },
  }),
  sec: (h: "left" | "center" | "right" = "left"): XStyle => ({
    fill: fill(C.secBg),
    font: { bold: true, color: { rgb: C.secFg }, sz: 10 },
    alignment: { horizontal: h, vertical: "center" },
  }),
  tot: (h: "left" | "center" | "right" = "right"): XStyle => ({
    fill: fill(C.totBg),
    font: { bold: true, color: { rgb: C.totFg }, sz: 10 },
    alignment: { horizontal: h, vertical: "center" },
  }),
  sub: (h: "left" | "center" | "right" = "right"): XStyle => ({
    fill: fill(C.subBg),
    font: { bold: true, color: { rgb: C.subFg }, sz: 10 },
    alignment: { horizontal: h, vertical: "center" },
  }),
  wk: (): XStyle => ({
    fill: fill(C.wkBg),
    font: { bold: true, color: { rgb: C.wkFg }, sz: 10 },
    alignment: { horizontal: "left", vertical: "center" },
  }),
  attCell: (code: string): XStyle | null => {
    const shared: XFont = { bold: true, sz: 9 };
    if (code === "F")   return { fill: fill(C.fBg),  font: { ...shared, color: { rgb: C.fFg  } }, alignment: { horizontal: "center" } };
    if (code === "SH")  return { fill: fill(C.shBg), font: { ...shared, color: { rgb: C.shFg } }, alignment: { horizontal: "center" } };
    if (code === "AL")  return { fill: fill(C.alBg), font: { ...shared, color: { rgb: C.alFg } }, alignment: { horizontal: "center" } };
    if (code === "SL")  return { fill: fill(C.slBg), font: { ...shared, color: { rgb: C.slFg } }, alignment: { horizontal: "center" } };
    return null;
  },
  ot: (): XStyle => ({
    fill: fill(C.otBg),
    font: { color: { rgb: C.otFg }, sz: 10 },
    alignment: { horizontal: "right" },
  }),
  net: (): XStyle => ({
    fill: fill(C.netBg),
    font: { bold: true, color: { rgb: C.netFg }, sz: 10 },
    alignment: { horizontal: "right" },
  }),
  deduct: (): XStyle => ({
    fill: fill(C.deductBg),
    font: { color: { rgb: C.deductFg }, sz: 10 },
    alignment: { horizontal: "left" },
  }),
  bank: (): XStyle => ({
    fill: fill(C.bankBg),
    font: { bold: true, color: { rgb: C.bankFg }, sz: 10 },
    alignment: { horizontal: "right" },
  }),
  shSum: (): XStyle => ({ fill: fill(C.shBg), font: { bold: true, color: { rgb: C.shFg }, sz: 10 }, alignment: { horizontal: "center" } }),
  alSum: (): XStyle => ({ fill: fill(C.alBg), font: { bold: true, color: { rgb: C.alFg }, sz: 10 }, alignment: { horizontal: "center" } }),
  slSum: (): XStyle => ({ fill: fill(C.slBg), font: { bold: true, color: { rgb: C.slFg }, sz: 10 }, alignment: { horizontal: "center" } }),
};

// ─── Cell Style Application ───────────────────────────────────────────────────

function sc(ws: XLSX.WorkSheet, r: number, c: number, s: XStyle) {
  const a = XLSX.utils.encode_cell({ r, c });
  if (!ws[a]) ws[a] = { v: "", t: "s" };
  (ws[a] as any).s = s;
}

function styleRange(ws: XLSX.WorkSheet, r: number, c0: number, c1: number, s: XStyle) {
  for (let c = c0; c <= c1; c++) sc(ws, r, c, s);
}

// ─── Sheet 1: Salary Summary ──────────────────────────────────────────────────

function buildSalarySummarySheet(payload: PTExportPayload, refNum: string): XLSX.WorkSheet {
  const { staff, period, restaurantName, generatedBy } = payload;
  const COL = 10;
  const rows: (string | number | null)[][] = [];

  rows.push(["AMAZONIA HR MANAGEMENT SYSTEM — PART-TIME PAYROLL REPORT"]);
  rows.push([`Restaurant: ${restaurantName}  |  Period: ${format(parseISO(period.start), "d MMM yyyy")} – ${format(parseISO(period.end), "d MMM yyyy")}  |  Ref: ${refNum}`]);
  rows.push([`Prepared by: ${generatedBy || "System"}  |  Generated: ${format(new Date(), "d MMM yyyy, HH:mm")}  |  CONFIDENTIAL`]);
  rows.push([null]);

  rows.push([
    "Staff Name", "Position", "Total Hours", "Regular Hours",
    "OT Hours", "Hourly Rate (HKD)", "Gross Pay (HKD)", "Leave Pay (HKD)", "Deductions (HKD)", "Net Pay (HKD)",
  ]);

  const DATA_START = 5;

  for (const s of staff) {
    rows.push([
      s.staffName, s.position,
      s.totalHours, s.regularHours, s.overtimeHours,
      s.hourlyRate, s.grossPay, s.leavePay, s.deductions, s.netPay,
    ]);
  }

  rows.push([
    "GRAND TOTAL", "",
    staff.reduce((a, s) => a + s.totalHours, 0),
    staff.reduce((a, s) => a + s.regularHours, 0),
    staff.reduce((a, s) => a + s.overtimeHours, 0),
    null,
    staff.reduce((a, s) => a + s.grossPay, 0),
    staff.reduce((a, s) => a + s.leavePay, 0),
    staff.reduce((a, s) => a + s.deductions, 0),
    staff.reduce((a, s) => a + s.netPay, 0),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Title rows (0–2): dark header, centered
  for (let r = 0; r <= 2; r++) styleRange(ws, r, 0, COL - 1, S.hdr("center"));

  // Column headers (row 4): section header style, centered; name/position left
  styleRange(ws, 4, 0, COL - 1, S.sec("center"));
  sc(ws, 4, 0, S.sec("left"));
  sc(ws, 4, 1, S.sec("left"));

  // Data rows (5..N+4)
  for (let i = 0; i < staff.length; i++) {
    const r = DATA_START + i;
    const s = staff[i];
    // OT hours (col 4) amber if > 0
    if (s.overtimeHours > 0) sc(ws, r, 4, S.ot());
    // Net pay (col 9) always green
    sc(ws, r, 9, S.net());
  }

  // Grand total row
  const totRow = DATA_START + staff.length;
  styleRange(ws, totRow, 0, COL - 1, S.tot());
  sc(ws, totRow, 0, S.tot("left"));

  ws["!cols"] = [
    { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
  ];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COL - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COL - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COL - 1 } },
  ];
  ws["!freeze"] = { xSplit: 0, ySplit: 5 };
  return ws;
}

// ─── Sheet 2: Attendance Grid ─────────────────────────────────────────────────

function buildAttendanceGridSheet(payload: PTExportPayload): XLSX.WorkSheet {
  const { staff, period } = payload;
  const allDays = eachDayOfInterval({
    start: parseISO(period.start),
    end: parseISO(period.end),
  });
  const allDayKeys = allDays.map((d) => format(d, "yyyy-MM-dd"));
  const D = allDays.length;
  const totalCols = 1 + D + 3; // name + days + SH/AL/SL

  const rows: (string | number | null)[][] = [];

  rows.push([
    "Staff Name",
    ...allDays.map((d) => Number(format(d, "d"))),
    "Total SH", "Total AL", "Total SL",
  ]);
  rows.push([
    "",
    ...allDays.map((d) => format(d, "EEE").toUpperCase()),
    "", "", "",
  ]);

  for (const s of staff) {
    rows.push([
      s.staffName,
      ...allDayKeys.map((k) => s.attendanceDates[k] || "OFF"),
      s.leaveSummary.sh,
      s.leaveSummary.al,
      s.leaveSummary.sl,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Header row (0): dark, centered; name col left
  styleRange(ws, 0, 0, totalCols - 1, S.hdr("center"));
  sc(ws, 0, 0, S.hdr("left"));

  // Sub-header row (1): section style, centered
  styleRange(ws, 1, 0, totalCols - 1, S.sec("center"));

  // Staff rows (2+)
  for (let i = 0; i < staff.length; i++) {
    const r = 2 + i;
    const s = staff[i];

    for (let d = 0; d < D; d++) {
      const code = s.attendanceDates[allDayKeys[d]] || "OFF";
      const style = S.attCell(code);
      if (style) sc(ws, r, 1 + d, style);
    }

    // Summary columns
    const shCol = 1 + D;
    if (s.leaveSummary.sh > 0) sc(ws, r, shCol, S.shSum());
    if (s.leaveSummary.al > 0) sc(ws, r, shCol + 1, S.alSum());
    if (s.leaveSummary.sl > 0) sc(ws, r, shCol + 2, S.slSum());
  }

  const colWidths: { wch: number }[] = [{ wch: 28 }];
  for (let i = 0; i < D; i++) colWidths.push({ wch: 5 });
  colWidths.push({ wch: 10 }, { wch: 10 }, { wch: 10 });
  ws["!cols"] = colWidths;
  ws["!freeze"] = { xSplit: 1, ySplit: 2 };
  return ws;
}

// ─── Sheet 3: Staff Deduction Sheet ──────────────────────────────────────────

function buildDeductionSheet(payload: PTExportPayload): XLSX.WorkSheet {
  const { staff, period, restaurantName } = payload;
  const COL = 7;
  const rows: (string | number | null)[][] = [];

  rows.push(["STAFF DEDUCTION SHEET"]);
  rows.push([`${restaurantName}  |  ${format(parseISO(period.start), "d MMM yyyy")} – ${format(parseISO(period.end), "d MMM yyyy")}`]);
  rows.push([null]);
  rows.push(["S.N.", "Staff Name", "HKID", "Commencement Date", "Position", "Deduction Reason", "Days to Pay"]);

  const DATA_START = 4;

  const staffDeductions: { reasons: string; hasDeduction: boolean }[] = [];

  staff.forEach((s, i) => {
    const reasons: string[] = [];
    if (s.leaveSummary.sl > 0) reasons.push(`SL ×${s.leaveSummary.sl}`);
    if (s.leaveSummary.upl > 0) reasons.push(`UPL ×${s.leaveSummary.upl}`);
    const offDays = Object.values(s.attendanceDates).filter((c) => c === "OFF").length;
    if (offDays > 0) reasons.push(`Absent ×${offDays}`);
    const workedDays = Object.values(s.attendanceDates).filter((c) => c === "F").length;
    const reasonStr = reasons.length ? reasons.join(", ") : "—";

    staffDeductions.push({ reasons: reasonStr, hasDeduction: reasons.length > 0 });

    rows.push([
      i + 1, s.staffName,
      s.hkid || "N/A",
      format(parseISO(s.hireDate), "d MMM yyyy"),
      s.position, reasonStr, workedDays,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Title rows (0–1)
  styleRange(ws, 0, 0, COL - 1, S.hdr("center"));
  styleRange(ws, 1, 0, COL - 1, S.hdr("center"));

  // Column headers (row 3)
  styleRange(ws, 3, 0, COL - 1, S.sec("center"));
  sc(ws, 3, 1, S.sec("left"));
  sc(ws, 3, 4, S.sec("left"));
  sc(ws, 3, 5, S.sec("left"));

  // Data rows
  for (let i = 0; i < staff.length; i++) {
    const r = DATA_START + i;
    if (staffDeductions[i].hasDeduction) {
      sc(ws, r, 5, S.deduct()); // Deduction reason cell
    }
  }

  ws["!cols"] = [
    { wch: 6 }, { wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 40 }, { wch: 14 },
  ];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COL - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COL - 1 } },
  ];
  ws["!freeze"] = { xSplit: 0, ySplit: 4 };
  return ws;
}

// ─── Sheet 4: Bank Transfer Sheet ────────────────────────────────────────────

function buildBankTransferSheet(payload: PTExportPayload): XLSX.WorkSheet {
  const { staff, period, restaurantName } = payload;
  const COL = 12;
  const rows: (string | number | null)[][] = [];

  rows.push(["BANK TRANSFER SHEET"]);
  rows.push([`${restaurantName}  |  ${format(parseISO(period.start), "d MMM yyyy")} – ${format(parseISO(period.end), "d MMM yyyy")}  |  CONFIDENTIAL`]);
  rows.push([null]);
  rows.push([
    "Staff Name (per HKID)", "Nickname", "Position", "HKID",
    "Full Salary / Deduction", "Total Days to Pay", "OT Hours",
    "Hourly Rate (HKD)", "Joined Date", "Bank", "Bank Code", "Account Number",
  ]);

  const DATA_START = 4;

  for (const s of staff) {
    const workedDays = Object.values(s.attendanceDates).filter((c) => c === "F").length;
    rows.push([
      s.staffName,
      s.nickname || s.staffName.split(" ")[0],
      s.position,
      s.hkid || "N/A",
      s.netPay,
      workedDays,
      s.overtimeHours,
      s.hourlyRate,
      format(parseISO(s.hireDate), "d/M/yyyy"),
      s.bankName || "N/A",
      s.bankCode || "N/A",
      s.bankAccountNumber || "N/A",
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Title rows (0–1)
  styleRange(ws, 0, 0, COL - 1, S.hdr("center"));
  styleRange(ws, 1, 0, COL - 1, S.hdr("center"));

  // Column headers (row 3)
  styleRange(ws, 3, 0, COL - 1, S.sec("center"));
  sc(ws, 3, 0, S.sec("left"));
  sc(ws, 3, 2, S.sec("left"));

  // Data rows — Net Pay column (4) in green
  for (let i = 0; i < staff.length; i++) {
    sc(ws, DATA_START + i, 4, S.bank());
  }

  ws["!cols"] = [
    { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 14 },
    { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 18 },
    { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 22 },
  ];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COL - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COL - 1 } },
  ];
  ws["!freeze"] = { xSplit: 0, ySplit: 4 };
  return ws;
}

// ─── Sheet 5: Weekly Petty Cash ───────────────────────────────────────────────

function buildWeeklyPettyCashSheet(payload: PTExportPayload): XLSX.WorkSheet {
  const { staff, period, restaurantName, weeks } = payload;
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const COL = 12;
  const rows: (string | number | null)[][] = [];

  rows.push(["WEEKLY PETTY CASH SHEET — PART-TIME STAFF"]);
  rows.push([`${restaurantName}  |  ${format(parseISO(period.start), "d MMM yyyy")} – ${format(parseISO(period.end), "d MMM yyyy")}`]);
  rows.push([null]);
  rows.push(["Name", "Position", "Hourly Rate", "Per Day Rate", ...DAY_LABELS, "Weekly Total"]);

  // Title rows (0–1) and col headers (row 3)
  const ws_rows_before_data = 4;

  // Track which rows are what
  type RowMeta = { type: "wk" | "staff" | "sub"; staffIdx?: number; weekIdx?: number };
  const rowMeta: RowMeta[] = [];
  // rows 0-3 already added, meta for styled rows starts from row 4 (0-based array idx)
  // But styling uses actual row index in ws. rows 0–3 are handled outside loop.

  for (const week of weeks) {
    const ws2 = parseISO(week.weekStart);
    const we = parseISO(week.weekEnd);

    rows.push([
      `WEEK: ${format(ws2, "d MMM")} – ${format(we, "d MMM yyyy")}`,
      null, null, null, null, null, null, null, null, null, null, null,
    ]);
    rowMeta.push({ type: "wk" });

    const weekDays = eachDayOfInterval({ start: ws2, end: we });

    for (let si = 0; si < staff.length; si++) {
      const s = staff[si];
      const staffWeek = s.weeks.find((w) => w.weekStart === week.weekStart);
      const dailyHours = staffWeek?.dailyHours || {};
      const dayRate = s.hourlyRate * 8;

      const dayCells = weekDays.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const hrs = dailyHours[key] || 0;
        return hrs > 0 ? hrs * s.hourlyRate : null;
      });

      rows.push([
        s.staffName, s.position,
        s.hourlyRate, dayRate,
        ...dayCells,
        staffWeek?.netPay || 0,
      ]);
      rowMeta.push({ type: "staff", staffIdx: si });
    }

    const weekTotal = staff.reduce((sum, s) => {
      const sw = s.weeks.find((w) => w.weekStart === week.weekStart);
      return sum + (sw?.netPay || 0);
    }, 0);
    rows.push([
      "WEEK SUBTOTAL", null, null, null,
      null, null, null, null, null, null, null,
      weekTotal,
    ]);
    rowMeta.push({ type: "sub" });
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Static header rows
  styleRange(ws, 0, 0, COL - 1, S.hdr("center"));
  styleRange(ws, 1, 0, COL - 1, S.hdr("center"));
  styleRange(ws, 3, 0, COL - 1, S.sec("center"));
  sc(ws, 3, 0, S.sec("left"));
  sc(ws, 3, 1, S.sec("left"));

  // Dynamic rows starting at row 4
  for (let i = 0; i < rowMeta.length; i++) {
    const r = ws_rows_before_data + i;
    const meta = rowMeta[i];

    if (meta.type === "wk") {
      styleRange(ws, r, 0, COL - 1, S.wk());
    } else if (meta.type === "sub") {
      styleRange(ws, r, 0, COL - 1, S.sub());
      sc(ws, r, COL - 1, S.net()); // Weekly total cell - green highlight
    } else if (meta.type === "staff") {
      // Daily pay cells (cols 4–10) — green if they have a value
      for (let c = 4; c <= 10; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (cell && cell.v !== null && cell.v !== undefined && Number(cell.v) > 0) {
          sc(ws, r, c, S.bank());
        }
      }
      // Weekly total (col 11) — always green
      sc(ws, r, COL - 1, S.bank());
    }
  }

  ws["!cols"] = [
    { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
  ];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COL - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COL - 1 } },
  ];
  ws["!freeze"] = { xSplit: 0, ySplit: 4 };
  return ws;
}

// ─── Main Export Function ─────────────────────────────────────────────────────

export function exportPTReportExcel(payload: PTExportPayload) {
  const refNum = genRef();
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildSalarySummarySheet(payload, refNum), "Salary Summary");
  XLSX.utils.book_append_sheet(wb, buildAttendanceGridSheet(payload), "Attendance Grid");
  XLSX.utils.book_append_sheet(wb, buildDeductionSheet(payload), "Deductions");
  XLSX.utils.book_append_sheet(wb, buildBankTransferSheet(payload), "Bank Sheet");
  XLSX.utils.book_append_sheet(wb, buildWeeklyPettyCashSheet(payload), "Weekly Petty Cash");

  const filename = `amazonia-pt-payroll-${format(parseISO(payload.period.start), "yyyyMM")}-${format(new Date(), "yyyyMMdd")}.xlsx`;
  XLSX.writeFile(wb, filename);
}
