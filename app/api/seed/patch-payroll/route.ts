import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * One-time patch endpoint — backfills ALL payroll fields for already-seeded staff.
 * Fields: staffNumber, autopayDay, monthlySalary, foodAllowance,
 *         incentive, monthlyDeduction, monthlyAdjustment,
 *         hkid, bankName, bankCode, bankAccountNumber
 * Safe to run multiple times (idempotent).
 * Protected by SEED_SECRET env var.
 */

// ─── Payroll data by FT category ─────────────────────────────────────────────
const FT_PAYROLL: Record<string, {
  monthlySalary: number;
  foodAllowance: number;
  incentive: number;
  monthlyDeduction: number;
}> = {
  Manager:   { monthlySalary: 28000, foodAllowance: 1500, incentive: 2000, monthlyDeduction: 200 },
  Chef:      { monthlySalary: 22000, foodAllowance: 1200, incentive: 1500, monthlyDeduction: 150 },
  Server:    { monthlySalary: 18000, foodAllowance: 800,  incentive: 500,  monthlyDeduction: 100 },
  Bartender: { monthlySalary: 20000, foodAllowance: 1000, incentive: 800,  monthlyDeduction: 100 },
  Host:      { monthlySalary: 16000, foodAllowance: 600,  incentive: 300,  monthlyDeduction: 100 },
};

// PT staff incentive (OT top-up)
const PT_INCENTIVE = 300;

// ─── Realistic HK bank pool ───────────────────────────────────────────────────
const BANKS = [
  { name: "HSBC",               code: "004" },
  { name: "Hang Seng Bank",     code: "024" },
  { name: "Bank of China (HK)", code: "012" },
  { name: "Standard Chartered", code: "003" },
  { name: "Citibank",           code: "006" },
];

// Seed-deterministic helpers (no randomness, fully idempotent)
function pickBank(i: number)    { return BANKS[i % BANKS.length]; }
function bankAccount(i: number) {
  // 9-digit account seeded by index
  return `${String((i * 137 + 100) % 900 + 100)}-${String((i * 83 + 10000) % 90000 + 10000)}-${String((i * 47 + 100) % 900 + 100)}`;
}
function hkid(i: number) {
  const letters = "ABCDEFGKP";
  const letter  = letters[i % letters.length];
  const digits  = String((i * 9973 + 100000) % 900000 + 100000); // 6 digits
  const check   = (i % 9) + 1;
  return `${letter}${digits}(${check})`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { seedKey } = body;

  const expectedKey = process.env.SEED_SECRET ?? "amazonia-seed-2026";
  if (seedKey !== expectedKey) {
    return NextResponse.json({ error: "Invalid seed key" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: [{ restaurantId: "asc" }, { hireDate: "asc" }, { createdAt: "asc" }],
      include: { staffCategory: true },
    });

    // Group by restaurantId → sequential staffNumber per restaurant
    const byRestaurant: Record<string, typeof users> = {};
    for (const u of users) {
      const rid = u.restaurantId ?? "__none__";
      if (!byRestaurant[rid]) byRestaurant[rid] = [];
      byRestaurant[rid].push(u);
    }

    const results: unknown[] = [];
    let globalIdx = 0; // for deterministic HKID / bank assignment across all staff

    for (const [, staffList] of Object.entries(byRestaurant)) {
      let seq = 1;
      for (const staff of staffList) {
        const staffNumber  = String(seq).padStart(3, "0");
        const catName      = staff.staffCategory?.name ?? "";
        const isFT         = staff.employmentType === "FULL_TIME";
        const payroll      = FT_PAYROLL[catName] ?? null;
        const bank         = pickBank(globalIdx);

        // Occasional signed adjustment (deterministic — not random, so re-runs are identical)
        const monthlyAdjustment = seq % 5 === 0 ? -100 : seq % 7 === 0 ? 200 : null;

        const updated = await prisma.user.update({
          where: { id: staff.id },
          data: {
            // ── Identity / bank ────────────────────────────────────────────
            hkid:              hkid(globalIdx),
            bankName:          bank.name,
            bankCode:          bank.code,
            bankAccountNumber: bankAccount(globalIdx),
            // ── Payroll ────────────────────────────────────────────────────
            staffNumber,
            autopayDay:        7,
            monthlySalary:     isFT && payroll ? payroll.monthlySalary   : undefined,
            foodAllowance:     isFT && payroll ? payroll.foodAllowance    : undefined,
            incentive:         isFT && payroll ? payroll.incentive        : PT_INCENTIVE,
            monthlyDeduction:  isFT && payroll ? payroll.monthlyDeduction : undefined,
            monthlyAdjustment: monthlyAdjustment ?? undefined,
          },
          select: {
            id:               true,
            name:             true,
            employmentType:   true,
            staffNumber:      true,
            hkid:             true,
            bankName:         true,
            bankCode:         true,
            bankAccountNumber:true,
            monthlySalary:    true,
            foodAllowance:    true,
            incentive:        true,
            monthlyDeduction: true,
            monthlyAdjustment:true,
            autopayDay:       true,
          },
        });

        results.push(updated);
        seq++;
        globalIdx++;
      }
    }

    return NextResponse.json({
      message: `Patched ${results.length} staff records with full payroll fields.`,
      updated: results,
    });
  } catch (error) {
    console.error("[POST /api/seed/patch-payroll]", error);
    return NextResponse.json(
      { error: "Internal server error", detail: String(error) },
      { status: 500 }
    );
  }
}
