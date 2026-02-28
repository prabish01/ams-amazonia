import jsPDF from "jspdf";
import type { PayslipData, PayslipResponse } from "@/app/api/reports/payslip/route";

// ─── Constants ────────────────────────────────────────────────────────────────

// A4 portrait: 210 × 297 mm
const PAGE_W  = 210;
const PAGE_H  = 297;
const MARGIN  = 8;           // left/right margin
const CONTENT_W = PAGE_W - MARGIN * 2;  // 194 mm

// 3 slips per page, each 90 mm tall, with 3.5 mm gap for cut line
const SLIP_H  = 90;
const CUT_GAP = 3.5;
const SLIP_OFFSETS = [8, 8 + SLIP_H + CUT_GAP, 8 + (SLIP_H + CUT_GAP) * 2];

// Colours
const C = {
  black:      [0,   0,   0]   as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  headerBg:   [230, 230, 230] as [number, number, number],  // light grey header
  rowAlt:     [247, 247, 247] as [number, number, number],  // faint row stripe
  yellow:     [255, 240, 50]  as [number, number, number],  // net total highlight
  border:     [160, 160, 160] as [number, number, number],
  labelText:  [80,  80,  80]  as [number, number, number],
  midGrey:    [130, 130, 130] as [number, number, number],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hkd(n: number): string {
  if (n === 0) return "0.00";
  const sign = n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function setFont(doc: jsPDF, size: number, style: "normal" | "bold" = "normal") {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
}

function drawDashedLine(doc: jsPDF, y: number) {
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);

  const segLen = 3;
  const gap    = 2;
  let x = MARGIN;

  while (x < PAGE_W - MARGIN) {
    doc.line(x, y, Math.min(x + segLen, PAGE_W - MARGIN), y);
    x += segLen + gap;
  }
  doc.setLineWidth(0.5);
}

// ─── Draw a single payslip ────────────────────────────────────────────────────

function drawSlip(doc: jsPDF, slip: PayslipData, restaurantName: string, y0: number) {
  const L = MARGIN;        // left edge
  const R = PAGE_W - MARGIN; // right edge

  // ── Outer border ─────────────────────────────────────────────────────────
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.4);
  doc.rect(L, y0, CONTENT_W, SLIP_H - 1);

  // ── Restaurant header strip ───────────────────────────────────────────────
  doc.setFillColor(...C.headerBg);
  doc.rect(L, y0, CONTENT_W, 7, "F");

  setFont(doc, 9, "bold");
  doc.setTextColor(...C.black);
  doc.text(restaurantName.toUpperCase() + "  —  SALARY SLIP", PAGE_W / 2, y0 + 4.5, { align: "center" });

  // ── Divider below header ──────────────────────────────────────────────────
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(L, y0 + 7, R, y0 + 7);

  // ── Staff info grid (2×3 grid of label | value pairs) ────────────────────
  const INFO_TOP  = y0 + 9;
  const INFO_H    = 17;
  const colW      = CONTENT_W / 2;

  const leftCol   = L + 2;
  const rightCol  = L + colW + 2;
  const labelOff  = 0;
  const valueOff  = 32;    // mm from column start to value — must be > longest label

  const infoRows: [string, string, string, string][] = [
    ["Staff Name",  slip.staffName,    "Staff No.",    slip.staffNumber],
    ["Start Date",  slip.hireDate,     "Position",     slip.position],
    ["Pay Period",  slip.payrollPeriod,"Autopay Date", slip.autopayDate],
  ];

  let iy = INFO_TOP + 3.5;
  for (const [ll, lv, rl, rv] of infoRows) {
    // Left label
    setFont(doc, 6.5);
    doc.setTextColor(...C.labelText);
    doc.text(ll, leftCol + labelOff, iy);

    // Left value
    setFont(doc, 6.5, "bold");
    doc.setTextColor(...C.black);
    doc.text(lv, leftCol + valueOff, iy);

    // Right label
    setFont(doc, 6.5);
    doc.setTextColor(...C.labelText);
    doc.text(rl, rightCol + labelOff, iy);

    // Right value
    setFont(doc, 6.5, "bold");
    doc.setTextColor(...C.black);
    doc.text(rv, rightCol + valueOff, iy);

    iy += 4.5;
  }

  // Horizontal rule between info and table
  const TABLE_TOP = y0 + 7 + INFO_H;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(L, TABLE_TOP, R, TABLE_TOP);

  // ── Two-column table: Additions | Deductions ─────────────────────────────
  const halfW     = CONTENT_W / 2;
  // TABLE_H: total height from TABLE_TOP to bottom inner edge of slip
  const TABLE_H   = SLIP_H - 1 - (TABLE_TOP - y0); // no extra -1 so rows fill perfectly
  const COL_BREAK = L + halfW;

  // Vertical divider between addition and deduction columns
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(COL_BREAK, TABLE_TOP, COL_BREAK, y0 + SLIP_H - 1);

  // Column headers
  const HDR_H = 5;
  doc.setFillColor(...C.headerBg);
  doc.rect(L, TABLE_TOP, halfW, HDR_H, "F");
  doc.rect(COL_BREAK, TABLE_TOP, halfW, HDR_H, "F");

  setFont(doc, 6.5, "bold");
  doc.setTextColor(...C.black);
  doc.text("ADDITION", L + halfW / 2, TABLE_TOP + 3.2, { align: "center" });
  doc.text("DEDUCTION", COL_BREAK + halfW / 2, TABLE_TOP + 3.2, { align: "center" });

  doc.setDrawColor(...C.border);
  doc.line(L, TABLE_TOP + HDR_H, R, TABLE_TOP + HDR_H);

  // ── Build row data ────────────────────────────────────────────────────────

  const addRows: Array<{ label: string; amount: number }> = [
    { label: "Basic Salary",     amount: slip.basicSalary    || 0 },
    { label: "Food Allowance",   amount: (slip.employmentType === "FULL_TIME" && slip.foodAllowance > 0) ? slip.foodAllowance : 0 },
    { label: "Overtime Payment", amount: slip.overtimePayment > 0 ? slip.overtimePayment : 0 },
    ...slip.additions.map((a) => ({ label: a.label, amount: a.amount })),
  ].filter((r) => r.amount !== 0);

  const dedRows: Array<{ label: string; amount: number }> = [
    { label: "No Pay Leave",  amount: slip.nplDeduction > 0 ? slip.nplDeduction : 0 },
    { label: "MPF (5%)",      amount: slip.mpf > 0 ? slip.mpf : 0 },
    ...slip.deductions.map((d) => ({ label: d.label, amount: d.amount })),
  ].filter((r) => r.amount !== 0);

  const maxRows = Math.max(addRows.length, dedRows.length, 4); // at least 4 rows

  // rowH fills exactly ROWS_ZONE_H so there is no blank gap before the TOTAL line
  const ROWS_ZONE_H = TABLE_H - HDR_H - 16; // 16 mm reserved for Total(5) + Bank(5) + Net(6)
  const rowH = ROWS_ZONE_H / maxRows;

  // Vertical text offset within a row — visually centering baseline in the cell
  const textOff = (rowH: number) => rowH * 0.55 + 1.5;

  let ry = TABLE_TOP + HDR_H;

  for (let i = 0; i < maxRows; i++) {
    const aRow = addRows[i];
    const dRow = dedRows[i];

    // Faint alternating stripe
    if (i % 2 === 1) {
      doc.setFillColor(...C.rowAlt);
      doc.rect(L, ry, CONTENT_W, rowH, "F");
    }

    setFont(doc, 6);
    doc.setTextColor(...C.labelText);

    if (aRow) {
      doc.text(aRow.label, L + 2, ry + textOff(rowH));
      setFont(doc, 6, "bold");
      doc.setTextColor(aRow.amount < 0 ? 180 : 30, 30, 30);
      doc.text(hkd(aRow.amount), COL_BREAK - 2, ry + textOff(rowH), { align: "right" });
    }

    if (dRow) {
      setFont(doc, 6);
      doc.setTextColor(...C.labelText);
      doc.text(dRow.label, COL_BREAK + 2, ry + textOff(rowH));
      setFont(doc, 6, "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(hkd(dRow.amount), R - 2, ry + textOff(rowH), { align: "right" });
    }

    ry += rowH;
  }

  // ── Totals row ──────────────────────────────────────────────────────────────
  // TOT_Y: leave 16 mm at bottom for Total(5) + Bank(5) + Net(6)
  const TOT_Y = y0 + SLIP_H - 1 - 16;
  doc.setDrawColor(...C.border);
  doc.line(L, TOT_Y, R, TOT_Y);

  doc.setFillColor(240, 240, 240);
  doc.rect(L, TOT_Y, CONTENT_W, 5, "F");

  setFont(doc, 6.5, "bold");
  doc.setTextColor(...C.black);
  doc.text("TOTAL", L + 2, TOT_Y + 3.3);
  doc.text(hkd(slip.totalAdditions), COL_BREAK - 2, TOT_Y + 3.3, { align: "right" });
  doc.text("TOTAL", COL_BREAK + 2, TOT_Y + 3.3);
  doc.text(hkd(slip.totalDeductions), R - 2, TOT_Y + 3.3, { align: "right" });

  doc.line(L, TOT_Y + 5, R, TOT_Y + 5);

  // ── Bank info row ─────────────────────────────────────────────────────────
  const BANK_Y = TOT_Y + 5;
  setFont(doc, 6);
  doc.setTextColor(...C.labelText);
  const bankLabel = `Bank: ${slip.bankName} (${slip.bankCode})  Acc: ${slip.bankAccount}`;
  doc.text(bankLabel, L + 2, BANK_Y + 3.4);

  doc.line(L, BANK_Y + 5, R, BANK_Y + 5);

  // ── Net Total row (yellow) ────────────────────────────────────────────────
  const NET_Y = BANK_Y + 5;
  doc.setFillColor(...C.yellow);
  doc.rect(L, NET_Y, CONTENT_W, 6, "F");

  setFont(doc, 7.5, "bold");
  doc.setTextColor(...C.black);
  doc.text("NET TOTAL", L + 2, NET_Y + 4);
  doc.text(`HK$ ${hkd(slip.netTotal)}`, R - 2, NET_Y + 4, { align: "right" });
}

// ─── Main export function ─────────────────────────────────────────────────────

export function exportPayslipPDF(payload: PayslipResponse): void {
  const { restaurantName, month, payslips } = payload;
  if (!payslips.length) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let slipIndex = 0;

  for (const slip of payslips) {
    const posOnPage = slipIndex % 3;

    if (slipIndex > 0 && posOnPage === 0) {
      doc.addPage();
    }

    const y0 = SLIP_OFFSETS[posOnPage];
    drawSlip(doc, slip, restaurantName, y0);

    // Draw dashed cut line between slips (not after the last slip on a page or overall)
    if (posOnPage < 2 && slipIndex < payslips.length - 1) {
      const cutY = y0 + SLIP_H - 1 + (CUT_GAP / 2) + 0.5;
      drawDashedLine(doc, cutY);

      // Scissor icon hint
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.midGrey);
      doc.text("✂", PAGE_W - MARGIN + 1, cutY + 1);
    }

    slipIndex++;
  }

  // Save
  const now = new Date();
  const ts  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  doc.save(`payslips-${restaurantName.replace(/\s+/g, "_")}-${month}-${ts}.pdf`);
}
