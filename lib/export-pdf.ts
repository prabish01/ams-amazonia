import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportRow {
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

export interface ExportPDFOptions {
  reportData: ReportRow[];
  period: { start: string; end: string };
  reportType: "individual" | "restaurant" | "all";
  restaurantName?: string;
  generatedBy?: string;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  black:      [17, 17, 19]       as [number, number, number],
  headerBg:   [24, 24, 27]       as [number, number, number],
  gold:       [212, 140, 28]     as [number, number, number],
  goldLight:  [245, 166, 35]     as [number, number, number],
  white:      [255, 255, 255]    as [number, number, number],
  offWhite:   [250, 250, 250]    as [number, number, number],
  rowAlt:     [245, 245, 247]    as [number, number, number],
  totalsBg:   [24, 24, 27]       as [number, number, number],
  borderGray: [220, 220, 225]    as [number, number, number],
  textDark:   [30, 30, 35]       as [number, number, number],
  textMid:    [100, 100, 110]    as [number, number, number],
  textLight:  [155, 155, 165]    as [number, number, number],
  green:      [22, 163, 74]      as [number, number, number],
  greenBg:    [220, 252, 231]    as [number, number, number],
  amber:      [180, 83, 9]       as [number, number, number],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hkd(n: number) {
  return `HK$ ${n.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function hrs(n: number) {
  return `${n.toFixed(2)}h`;
}

function genRef() {
  const ts = format(new Date(), "yyyyMMdd");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AHR-${ts}-${rand}`;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportReportPDF(opts: ExportPDFOptions) {
  const { reportData, period, reportType, restaurantName, generatedBy } = opts;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 14;
  const MR = PW - ML;
  const refNum = genRef();

  // ── Totals ─────────────────────────────────────────────────────────────────
  const sumHours    = reportData.reduce((s, r) => s + r.totalHours, 0);
  const sumRegular  = reportData.reduce((s, r) => s + r.regularHours, 0);
  const sumOT       = reportData.reduce((s, r) => s + r.overtimeHours, 0);
  const sumGross    = reportData.reduce((s, r) => s + r.grossEarnings, 0);
  const sumLeave    = reportData.reduce((s, r) => s + r.leavePayments, 0);
  const sumPayable  = reportData.reduce((s, r) => s + r.totalPayable, 0);
  const sumDays     = reportData.reduce((s, r) => s + r.leaveDays, 0);

  // ─────────────────────────────────────────────────────────────────────────────
  // HEADER BAND
  // ─────────────────────────────────────────────────────────────────────────────

  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, PW, 30, "F");

  // Gold left stripe
  doc.setFillColor(...C.gold);
  doc.rect(0, 0, 3, 30, "F");

  // Gold bottom line
  doc.setFillColor(...C.goldLight);
  doc.rect(0, 30, PW, 0.8, "F");

  // Company wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...C.gold);
  doc.text("AMAZONIA", ML + 4, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.textLight);
  doc.text("HR MANAGEMENT SYSTEM", ML + 4, 19);

  // Divider inside header
  doc.setDrawColor(55, 55, 60);
  doc.setLineWidth(0.3);
  doc.line(ML + 4, 22, ML + 4, 28);

  // Report label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text("PAYROLL AUDIT REPORT", MR, 13, { align: "right" });

  // Reference & classification
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.textLight);
  doc.text(`Ref: ${refNum}`, MR, 20, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gold);
  doc.text("● CONFIDENTIAL", MR, 27, { align: "right" });

  // ─────────────────────────────────────────────────────────────────────────────
  // METADATA ROW
  // ─────────────────────────────────────────────────────────────────────────────

  let y = 38;

  const reportTypeLabel =
    reportType === "individual"
      ? "Individual Staff Report"
      : reportType === "restaurant"
        ? `Restaurant Report${restaurantName ? ` — ${restaurantName}` : ""}`
        : "All Restaurants Report";

  const meta = [
    { label: "REPORT TYPE",  value: reportTypeLabel },
    { label: "AUDIT PERIOD", value: `${format(new Date(period.start), "d MMM yyyy")} – ${format(new Date(period.end), "d MMM yyyy")}` },
    { label: "GENERATED",    value: format(new Date(), "d MMM yyyy, HH:mm") },
    { label: "PREPARED BY",  value: generatedBy || "System" },
    { label: "STAFF COUNT",  value: `${reportData.length} member${reportData.length !== 1 ? "s" : ""}` },
  ];

  const colW = (PW - ML * 2) / meta.length;
  meta.forEach((m, i) => {
    const x = ML + i * colW;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.textMid);
    doc.text(m.label, x, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.textDark);
    doc.text(m.value, x, y + 5.5);
  });

  y += 14;

  // Thin separator
  doc.setDrawColor(...C.borderGray);
  doc.setLineWidth(0.25);
  doc.line(ML, y, MR, y);
  y += 7;

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY BOXES
  // ─────────────────────────────────────────────────────────────────────────────

  const boxes = [
    { label: "TOTAL HOURS",    value: `${sumHours.toFixed(1)} hrs`,                         accent: C.gold  },
    { label: "REGULAR HOURS",  value: `${sumRegular.toFixed(1)} hrs`,                        accent: C.gold  },
    { label: "OVERTIME HOURS", value: `${sumOT.toFixed(1)} hrs`,                             accent: C.amber },
    { label: "GROSS EARNINGS", value: hkd(sumGross),                                          accent: C.gold  },
    { label: "TOTAL PAYABLE",  value: hkd(sumPayable),                                        accent: C.green },
    { label: "LEAVE DAYS",     value: `${sumDays} day${sumDays !== 1 ? "s" : ""}`,            accent: C.gold  },
  ];

  const boxGap = 2.5;
  const boxW = (PW - ML * 2 - boxGap * (boxes.length - 1)) / boxes.length;
  const boxH = 16;

  boxes.forEach((b, i) => {
    const x = ML + i * (boxW + boxGap);

    doc.setFillColor(...C.offWhite);
    doc.setDrawColor(...C.borderGray);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, boxW, boxH, 1.5, 1.5, "FD");

    // Colour top accent line
    doc.setFillColor(...b.accent);
    doc.roundedRect(x, y, boxW, 1.8, 1.5, 1.5, "F");
    doc.rect(x, y + 0.9, boxW, 0.9, "F"); // fill in bottom corners of accent

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.textMid);
    doc.text(b.label, x + 3.5, y + 6.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(i === 4 ? 9.5 : 9);
    doc.setTextColor(...b.accent);
    doc.text(b.value, x + 3.5, y + 13.5);
  });

  y += boxH + 7;

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA TABLE
  // ─────────────────────────────────────────────────────────────────────────────

  const colHeaders = [
    "Staff Member",
    "Total Hrs",
    "Regular Hrs",
    "Overtime Hrs",
    "Rate (HKD/hr)",
    "Gross Earnings",
    "Leave Pay",
    "Total Payable",
    "Leave Days",
  ];

  const tableRows = reportData.map((r) => [
    r.staffName,
    hrs(r.totalHours),
    hrs(r.regularHours),
    hrs(r.overtimeHours),
    `HK$ ${r.hourlyRate.toFixed(2)}`,
    hkd(r.grossEarnings),
    hkd(r.leavePayments),
    hkd(r.totalPayable),
    String(r.leaveDays),
  ]);

  // Totals footer row
  const totalsRow = [
    "TOTALS",
    hrs(sumHours),
    hrs(sumRegular),
    hrs(sumOT),
    "—",
    hkd(sumGross),
    hkd(sumLeave),
    hkd(sumPayable),
    String(sumDays),
  ];

  let pageNumber = 0;

  autoTable(doc, {
    head: [colHeaders],
    body: [...tableRows, totalsRow],
    startY: y,
    margin: { left: ML, right: ML },
    tableLineColor: C.borderGray,
    tableLineWidth: 0.25,
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: C.textDark,
      lineColor: C.borderGray,
      lineWidth: 0.2,
      font: "helvetica",
    },
    headStyles: {
      fillColor: C.headerBg,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: C.rowAlt,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 36 },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right", fontStyle: "bold" },
      8: { halign: "center" },
    },
    didParseCell(data) {
      // Style the totals row
      if (data.row.index === tableRows.length) {
        data.cell.styles.fillColor = C.totalsBg;
        data.cell.styles.textColor = C.white;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 8;
      }
      // Highlight overtime cells
      if (data.column.index === 3 && data.row.section === "body" && data.row.index < tableRows.length) {
        const val = parseFloat(String(reportData[data.row.index]?.overtimeHours || 0));
        if (val > 0) {
          data.cell.styles.textColor = C.amber;
          data.cell.styles.fontStyle = "bold";
        }
      }
      // Highlight total payable column
      if (data.column.index === 7 && data.row.section === "body" && data.row.index < tableRows.length) {
        data.cell.styles.textColor = C.green;
      }
    },
    didDrawPage() {
      pageNumber++;
      // Footer
      const footerY = PH - 7;
      doc.setDrawColor(...C.borderGray);
      doc.setLineWidth(0.25);
      doc.line(ML, footerY - 3, MR, footerY - 3);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...C.textMid);
      doc.text("AMAZONIA HR MANAGEMENT SYSTEM  ●  CONFIDENTIAL — FOR AUTHORISED USE ONLY", ML, footerY);
      doc.text(`Ref: ${refNum}`, PW / 2, footerY, { align: "center" });
      doc.text(`Page ${pageNumber}`, MR, footerY, { align: "right" });

      // Gold stripe at bottom
      doc.setFillColor(...C.gold);
      doc.rect(0, PH - 1.5, PW, 1.5, "F");
    },
  });

  const filename = `amazonia-payroll-${reportType}-${format(new Date(period.start), "yyyyMM")}-${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(filename);
}
