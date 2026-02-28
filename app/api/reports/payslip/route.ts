import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  getDaysInMonth,
  eachDayOfInterval,
} from "date-fns";

// ─── MPF Constants (HK) ───────────────────────────────────────────────────────
const MPF_RATE = 0.05;
const MPF_CAP = 1500;          // HKD monthly cap per employee
const MPF_MIN_INCOME = 7100;   // No MPF if monthly income < HKD 7,100

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayslipLineItem {
  label: string;
  amount: number; // negative for deductions shown in Additions column
}

export interface PayslipData {
  // Staff info
  staffId: string;
  staffName: string;
  staffNumber: string;
  position: string;
  hireDate: string;
  employmentType: "FULL_TIME" | "PART_TIME";

  // Period
  payrollPeriod: string;   // e.g. "January-26"
  autopayDate: string;     // e.g. "7-Feb-26"

  // Bank
  bankName: string;
  bankCode: string;
  bankAccount: string;

  // Additions column
  basicSalary: number;
  foodAllowance: number;
  overtimePayment: number;
  additions: PayslipLineItem[];   // extra lines beyond the standard ones
  totalAdditions: number;

  // Deductions column
  nplDeduction: number;           // No Pay Leave
  mpf: number;
  deductions: PayslipLineItem[];  // extra lines
  totalDeductions: number;

  // Net
  netTotal: number;
}

export interface PayslipResponse {
  restaurantName: string;
  month: string;
  generatedBy: string;
  payslips: PayslipData[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Decimal (returned as string from Prisma) to a plain number */
function dec(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return parseFloat(String(v));
}

/**
 * Next autopay date: autopayDay of the month following the payroll period.
 * e.g. payroll = Jan 2026, autopayDay = 7  →  "7-Feb-26"
 */
function buildAutopayDate(payrollStart: Date, autopayDay: number): string {
  const next = new Date(payrollStart.getFullYear(), payrollStart.getMonth() + 1, autopayDay);
  const dayStr = String(next.getDate());
  const mon = next.toLocaleString("en-GB", { month: "short" });
  const yr  = String(next.getFullYear()).slice(2);
  return `${dayStr}-${mon}-${yr}`;
}

/** Resolve the effective hourly rate for a staff member */
async function resolveHourlyRate(
  staffId: string,
  categoryId: string | null,
  restaurantId: string
): Promise<number> {
  const now = new Date();
  const whereActive = {
    effectiveFrom: { lte: now },
    OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
  };

  const staffRate = await prisma.salaryRate.findFirst({
    where: { staffId, ...whereActive },
    orderBy: { effectiveFrom: "desc" },
  });
  if (staffRate) return dec(staffRate.hourlyRate);

  if (categoryId) {
    const catRate = await prisma.salaryRate.findFirst({
      where: { categoryId, staffId: null, ...whereActive },
      orderBy: { effectiveFrom: "desc" },
    });
    if (catRate) return dec(catRate.hourlyRate);
  }

  const restRate = await prisma.salaryRate.findFirst({
    where: { restaurantId, staffId: null, categoryId: null, ...whereActive },
    orderBy: { effectiveFrom: "desc" },
  });
  return restRate ? dec(restRate.hourlyRate) : 0;
}

// ─── Core calculation for a single staff member ───────────────────────────────

async function buildPayslip(
  staff: {
    id: string;
    name: string;
    staffNumber: string | null;
    employmentType: string;
    hireDate: Date;
    restaurantId: string | null;
    categoryId: string | null;
    autopayDay: number | null;
    monthlySalary: unknown;
    foodAllowance: unknown;
    incentive: unknown;
    monthlyDeduction: unknown;
    monthlyAdjustment: unknown;
    bankName: string | null;
    bankCode: string | null;
    bankAccountNumber: string | null;
    staffCategory: { name: string } | null;
  },
  monthStart: Date
): Promise<PayslipData> {
  const monthEnd    = endOfMonth(monthStart);
  const daysInMonth = getDaysInMonth(monthStart);
  const isFT        = staff.employmentType === "FULL_TIME";
  const autopayDay  = staff.autopayDay ?? 7;
  const category    = staff.staffCategory?.name ?? "Staff";
  const rid         = staff.restaurantId ?? "";

  // ─ Period labels ─────────────────────────────────────────────────
  const payrollPeriod = format(monthStart, "MMMM-yy");           // "January-26"
  const autopayDate   = buildAutopayDate(monthStart, autopayDay); // "7-Feb-26"

  // ─ Bank ──────────────────────────────────────────────────────────
  const bankName    = staff.bankName    ?? "HSBC";
  const bankCode    = staff.bankCode    ?? "004";
  const bankAccount = staff.bankAccountNumber ?? "175-456862-833";

  // ─── Full-Time calculation ────────────────────────────────────────
  if (isFT) {
    const basicSalary     = dec(staff.monthlySalary);
    const foodAllowance   = dec(staff.foodAllowance);
    const incentive       = dec(staff.incentive);
    const monthlyDed      = dec(staff.monthlyDeduction);
    // Adjustment: positive = bonus (addition), negative = deduction
    const adjustment      = dec(staff.monthlyAdjustment);
    const adjustmentAdd   = adjustment > 0 ? adjustment : 0;
    const adjustmentDed   = adjustment < 0 ? Math.abs(adjustment) : 0;

    // Fetch approved UNPAID leave requests overlapping this month
    const unpaidLeave = await prisma.leaveRequest.findMany({
      where: {
        staffId:    staff.id,
        status:     "APPROVED",
        startDate:  { lte: monthEnd },
        endDate:    { gte: monthStart },
      },
      include: { category: true },
    });

    // Count NPL days (only truly UNPAID leave categories)
    let nplDays = 0;
    for (const lr of unpaidLeave) {
      if (lr.category.payType === "UNPAID") {
        const ls = lr.startDate < monthStart ? monthStart : lr.startDate;
        const le = lr.endDate   > monthEnd   ? monthEnd   : lr.endDate;
        if (ls <= le) {
          nplDays += eachDayOfInterval({ start: ls, end: le }).length;
        }
      }
    }

    const dailyRate    = (basicSalary + foodAllowance) / daysInMonth;
    const nplDeduction = parseFloat((dailyRate * nplDays).toFixed(2));

    // Gross for MPF = basic + food + incentive + adjustmentAdd - npl - monthlyDed - adjustmentDed
    const grossForMpf  = basicSalary + foodAllowance + incentive + adjustmentAdd - nplDeduction - monthlyDed - adjustmentDed;
    const mpf          = grossForMpf >= MPF_MIN_INCOME
      ? parseFloat(Math.min(grossForMpf * MPF_RATE, MPF_CAP).toFixed(2))
      : 0;

    const totalAdditions  = parseFloat((basicSalary + foodAllowance + incentive + adjustmentAdd - nplDeduction).toFixed(2));
    const totalDeductions = parseFloat((mpf + monthlyDed + adjustmentDed).toFixed(2));
    const netTotal        = parseFloat((totalAdditions - totalDeductions).toFixed(2));

    const additionLines: PayslipLineItem[] = [];
    if (incentive > 0)     additionLines.push({ label: "Incentive / OT", amount: incentive });
    if (adjustmentAdd > 0) additionLines.push({ label: "Adjustment (+)", amount: adjustmentAdd });

    const deductionLines: PayslipLineItem[] = [];
    if (monthlyDed > 0)    deductionLines.push({ label: "Other Deduction", amount: monthlyDed });
    if (adjustmentDed > 0) deductionLines.push({ label: "Adjustment (–)",  amount: adjustmentDed });

    return {
      staffId:       staff.id,
      staffName:     staff.name,
      staffNumber:   staff.staffNumber ?? "—",
      position:      category,
      hireDate:      format(new Date(staff.hireDate), "dd/MM/yyyy"),
      employmentType: "FULL_TIME",
      payrollPeriod,
      autopayDate,
      bankName,
      bankCode,
      bankAccount,
      basicSalary,
      foodAllowance,
      overtimePayment: 0,
      additions:  additionLines,
      totalAdditions,
      nplDeduction,
      mpf,
      deductions: deductionLines,
      totalDeductions,
      netTotal,
    };
  }

  // ─── Part-Time calculation ────────────────────────────────────────
  const hourlyRate = await resolveHourlyRate(staff.id, staff.categoryId, rid);

  const attendances = await prisma.attendance.findMany({
    where: {
      staffId: staff.id,
      date:    { gte: monthStart, lte: monthEnd },
    },
  });

  const totalMinutes   = attendances.reduce((s, a) => s + (a.durationMinutes ?? 0), 0);
  const totalHours     = totalMinutes / 60;
  const monthlyEarnings = parseFloat((totalHours * hourlyRate).toFixed(2));

  // PT also gets incentive/deduction/adjustment if set
  const incentive    = dec(staff.incentive);
  const monthlyDed   = dec(staff.monthlyDeduction);
  const adjustment   = dec(staff.monthlyAdjustment);
  const adjustmentAdd = adjustment > 0 ? adjustment : 0;
  const adjustmentDed = adjustment < 0 ? Math.abs(adjustment) : 0;

  const grossForMpf  = monthlyEarnings + incentive + adjustmentAdd - monthlyDed - adjustmentDed;
  const mpf = grossForMpf >= MPF_MIN_INCOME
    ? parseFloat(Math.min(grossForMpf * MPF_RATE, MPF_CAP).toFixed(2))
    : 0;

  const totalAdditions  = parseFloat((monthlyEarnings + incentive + adjustmentAdd).toFixed(2));
  const totalDeductions = parseFloat((mpf + monthlyDed + adjustmentDed).toFixed(2));
  const netTotal        = parseFloat((totalAdditions - totalDeductions).toFixed(2));

  const additionLines: PayslipLineItem[] = [];
  if (incentive > 0)     additionLines.push({ label: "Incentive / OT",  amount: incentive });
  if (adjustmentAdd > 0) additionLines.push({ label: "Adjustment (+)",   amount: adjustmentAdd });

  const deductionLines: PayslipLineItem[] = [];
  if (monthlyDed > 0)    deductionLines.push({ label: "Other Deduction", amount: monthlyDed });
  if (adjustmentDed > 0) deductionLines.push({ label: "Adjustment (–)",  amount: adjustmentDed });

  return {
    staffId:       staff.id,
    staffName:     staff.name,
    staffNumber:   staff.staffNumber ?? "—",
    position:      category,
    hireDate:      format(new Date(staff.hireDate), "dd/MM/yyyy"),
    employmentType: "PART_TIME",
    payrollPeriod,
    autopayDate,
    bankName,
    bankCode,
    bankAccount,
    basicSalary:     monthlyEarnings,
    foodAllowance:   0,
    overtimePayment: 0,
    additions:       additionLines,
    totalAdditions,
    nplDeduction:    0,
    mpf,
    deductions:      deductionLines,
    totalDeductions,
    netTotal,
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where:  { email: authUser.email! },
      select: { id: true, role: true, restaurantId: true, name: true },
    });
    if (!dbUser || !["SUPER_ADMIN", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { restaurantId, month, staffType } = body; // staffType: "FULL_TIME" | "PART_TIME" | undefined

    if (!month) {
      return NextResponse.json({ error: "month is required (e.g. '2026-01')" }, { status: 400 });
    }

    const monthStart = startOfMonth(parseISO(`${month}-01`));

    const targetRestaurantId = restaurantId || dbUser.restaurantId;
    if (!targetRestaurantId) {
      return NextResponse.json({ error: "restaurantId is required" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where:  { id: targetRestaurantId },
      select: { name: true },
    });

    // Fetch ALL active staff (or filtered by staffType) for the restaurant
    const staffList = await prisma.user.findMany({
      where: {
        restaurantId: targetRestaurantId,
        isActive: true,
        ...(staffType ? { employmentType: staffType } : {}),
      },
      include: { staffCategory: true },
      orderBy: [{ employmentType: "asc" }, { name: "asc" }],
    });

    if (!staffList.length) {
      return NextResponse.json({ error: "No staff found for this restaurant" }, { status: 400 });
    }

    const payslips = await Promise.all(
      staffList.map((s) => buildPayslip(s, monthStart))
    );

    const response: PayslipResponse = {
      restaurantName: restaurant?.name ?? "Restaurant",
      month,
      generatedBy:    dbUser.name,
      payslips,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[POST /api/reports/payslip]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
