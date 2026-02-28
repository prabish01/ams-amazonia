# Amazonia HR — Developer Instructions

## Initial Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

## Seeding

### 1. Create Super Admin (first run only)
```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"seedKey":"amazonia-seed-2026"}'
```

### 2. Seed All Staff & Data
Run from the dashboard or terminal after logging in. Use the existing seed script:
```bash
npx ts-node prisma/seed.ts
```

### 3. Patch Payroll Fields (run after seeding, or after schema changes)
Backfills **all** payroll fields for existing staff — safe to re-run multiple times:
```bash
curl -X POST http://localhost:3000/api/seed/patch-payroll \
  -H "Content-Type: application/json" \
  -d '{"seedKey":"amazonia-seed-2026"}'
```

**Fields patched by this endpoint:**
| Field | FT Staff | PT Staff |
|-------|----------|----------|
| `staffNumber` | Sequential per restaurant (001, 002…) | ✅ same |
| `autopayDay` | 7 (7th of following month) | ✅ same |
| `hkid` | Deterministic realistic HK format | ✅ same |
| `bankName` | Rotates: HSBC / Hang Seng / BOC HK / SCB / Citi | ✅ same |
| `bankCode` | Matching bank code | ✅ same |
| `bankAccountNumber` | Deterministic 9-digit format | ✅ same |
| `monthlySalary` | By category (Manager: $28k … Host: $16k) | — |
| `foodAllowance` | By category ($600–$1,500) | — |
| `incentive` | By category ($300–$2,000) | $300 flat |
| `monthlyDeduction` | By category ($100–$200) | — |
| `monthlyAdjustment` | Occasional ±100/200 scatter | ✅ same |

> ⚠️ Always re-run patch-payroll after adding new staff or after any schema migration that adds payroll fields.

---

## Payslip Generator

### How It Works
1. Go to **Reports → Full-Time (Monthly Payslip)** (or any Employment Type — the card is always visible)
2. Select **Payroll Month** (defaults to previous month)
3. Select **Staff Type**: All / Full-Time / Part-Time
4. Select **Restaurant** (Super Admin only)
5. Click **Generate & Download Payslips PDF**

### PDF Layout (3 per A4 page)
Each slip (90mm tall) contains:
- Grey header: restaurant name + "SALARY SLIP"
- Info grid: Staff Name, Staff No., Start Date, Position, Pay Period, Autopay Date
- Two-column table: **ADDITION** | **DEDUCTION**
- Bank info row
- Yellow-highlighted **NET TOTAL** row
- Dashed ✂ cut lines between slips

### Payslip Line Items
| Addition | Deduction |
|----------|-----------|
| Basic Salary | No Pay Leave |
| Food Allowance (FT) | MPF (5% of gross, cap HK$1,500) |
| Incentive / OT | Other Deduction |
| Adjustment (+) | Adjustment (–) |

### MPF Rules (HK)
- Rate: **5%** of relevant income
- Cap: **HK$1,500** per month
- Threshold: Only applies if monthly income **≥ HK$7,100**
- No Pay Leave deducted before MPF calculation

---

## Known Issues & Fixes

### ❌ NET TOTAL overlaps cut dashed line
**Symptom:** The yellow NET TOTAL band in the payslip PDF bleeds into the gap between slips and the dashed cut line runs through it.

**Root cause:** `TOT_Y = y0 + SLIP_H - 1 - N` where N must account for Total(5mm) + Bank(5mm) + Net(6mm) = 16mm total. Using N < 16 causes overflow outside the slip border rect.

**Fix:** In `lib/export-payslip-pdf.ts`, `TOT_Y` uses `- 16` and `ROWS_ZONE_H` uses `TABLE_H - HDR_H - 16`.

---

### ❌ Staff profile fields blank (HKID, bank, incentive etc.)
**Symptom:** Staff detail page shows "—" for HKID, bank details, incentive, monthly deduction, adjustment.

**Fix:** Re-run `/api/seed/patch-payroll` — it seeds all 11 payroll fields including HKID and bank info. See seeding section above.

---

### ❌ "Commencement Date" / label text overlaps value in PDF
**Symptom:** Long labels like "Commencement Date" overflow into the value column.

**Root cause:** `valueOff` (distance from column start to value text) was 22mm but "Commencement Date" at 6.5pt is ~30mm wide.

**Fix:** Labels shortened to "Start Date" / "Pay Period" and `valueOff` increased to 32mm in `lib/export-payslip-pdf.ts`.

---

## Environment Variables
```env
DATABASE_URL=...
DIRECT_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SEED_SECRET=amazonia-seed-2026
```
