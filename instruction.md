# Amazonia HR Management System — Instruction & Architecture Guide

> **Company:** Amazonia Group (Hong Kong)
> **Domain:** Multi-restaurant HR, Attendance, Leave & Payroll Management
> **Stack:** Next.js 16 (App Router) · TypeScript · Prisma 7 · Supabase (PostgreSQL + Auth) · TanStack Query v5 · Custom UI · Recharts
> **Target:** Mobile-first, responsive, modern minimal dark-mode corporate UI

---

## 1. Product Overview

Amazonia HR Management Suite is a centralised, role-based HR platform for a Hong Kong–based restaurant group. It handles:

- Multi-restaurant workspace management
- Staff attendance via system-clock punch in/out
- Leave management compliant with the Hong Kong Employment Ordinance (Cap. 57)
- Hourly wage configuration per restaurant / per staff category / per individual
- Weekly / Monthly payroll reports
- Personal earnings dashboard for staff

---

## 2. Tech Stack

| Layer         | Technology                                        | Purpose                                                               |
| ------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Framework     | Next.js 16.1.6 (App Router, RSC)                  | Full-stack React framework                                            |
| Language      | TypeScript (strict mode)                          | Type safety across frontend & backend                                 |
| ORM           | Prisma 7 + @prisma/adapter-pg                     | DB schema, migrations, type-safe queries (driver-adapter mode)        |
| Database      | Supabase (PostgreSQL)                             | Hosted Postgres + Auth + Row-level security                           |
| Auth          | Supabase Auth + @supabase/ssr (cookie sessions)   | Role-based session management via middleware                          |
| Data Fetching | TanStack Query v5 (React Query)                   | All client-side data fetching, caching, mutations, optimistic updates |
| UI Library    | Custom components (no Tailwind / Shadcn)          | Hand-crafted dark-mode components using inline React styles           |
| Styling       | Inline React styles (CSS-in-JS pattern)           | Dark-mode, consistent design tokens, zero className conflicts         |
| Forms         | React Hook Form + Zod                             | Type-safe form validation                                             |
| Charts        | Recharts v3                                       | Dashboard analytics — area, bar, line, pie charts                     |
| Tables        | TanStack Table v8                                 | Sortable, filterable, paginated data tables                           |
| PDF Export    | jsPDF + jspdf-autotable                           | Multi-page landscape/portrait payroll PDFs                            |
| Excel Export  | xlsx + xlsx-js-style                              | Multi-sheet styled payroll workbooks with coloured cells              |
| Date          | date-fns v4                                       | Date arithmetic, HK locale                                            |
| Icons         | Lucide React                                      | Consistent icon set                                                   |
| Toast         | Sonner                                            | Non-blocking notifications                                            |
| Deployment    | Vercel                                            | Zero-config Next.js hosting + Prisma build script                     |

---

## 3. User Roles & Permissions

```
SuperAdmin
  └── Can create / manage Restaurants (Workspaces)
  └── Can create Admin accounts per restaurant
  └── Sets global default leave allocations (annual, sick, etc.)
  └── Manages leave category library
  └── Sets hourly salary by restaurant + staff category + individual override
  └── Generates cross-restaurant payroll & attendance reports
  └── Views all dashboards

Admin (per Restaurant)
  └── Manages staff within their restaurant only
  └── Punch in/out monitoring
  └── Approves / rejects leave requests
  └── Sets & modifies hourly salary for their restaurant staff
  └── Generates reports for their restaurant
  └── Views restaurant-level dashboards

Staff (Full-time / Part-time / Waiter / Kitchen / Manager etc.)
  └── Punch in / Punch out (system time, one click)
  └── Views own attendance history
  └── Requests leave (from available categories)
  └── Creates custom leave category if none fits
  └── Views personal earnings dashboard
  └── Views leave balance
```

---

## 4. Feature Specifications

### 4.1 Workspace & Restaurant Management

- SuperAdmin lands on a **Workspace** dashboard showing all restaurants as cards
- Each card shows: Restaurant name, logo, staff count, today's attendance status
- **+ Add Restaurant** button opens a modal/drawer:
  - Restaurant name, address, timezone (default: Asia/Hong_Kong), cuisine type, description, logo upload
  - Assign an Admin user (email invite)
- Each restaurant has its own isolated data scope

### 4.2 Attendance — Punch In / Punch Out

- Staff dashboard shows a large **Punch In** button (green) when not clocked in
- On click: records `entry_time = NOW()` (server timestamp, not client) via API call
- Button changes to **Punch Out** (red) once clocked in
- On Punch Out: records `exit_time = NOW()`, calculates session duration
- **Rules:**
  - Can only punch in once per shift (prevent double punch-in)
  - Can punch out only after punching in
  - Admins can manually correct attendance records with an audit log entry
  - Part-time staff and full-time staff both use same system
- **Attendance Record fields:** `id, staff_id, restaurant_id, date, entry_time, exit_time, duration_minutes, is_manual_correction, corrected_by, correction_note, created_at`

### 4.3 Leave Management

#### 4.3.1 Hong Kong Employment Ordinance Compliance (Cap. 57)

All leave entitlements must meet or exceed HK statutory minimums:

**Annual Leave (Paid)**
| Years of Continuous Service | Minimum Annual Leave Days |
|---|---|
| 1 year | 7 days |
| 2 years | 8 days |
| 3 years | 9 days |
| 4 years | 10 days |
| 5 years | 11 days |
| 6 years | 12 days |
| 7 years | 13 days |
| 8 years or more | 14 days |

**Sick Leave (Paid Sickness Days)**

- Accumulation: 2 paid sickness days per completed month of service
- Maximum accumulation: 120 paid sickness days
- First 4 consecutive days: No pay
- From 5th consecutive day onwards: 4/5 of daily average wage
- Medical certificate required for paid sick leave

**Maternity Leave**

- Duration: 14 weeks paid (since 2020 amendment)
- Pay rate: 4/5 of daily average wage
- Eligibility: Employed continuously for ≥40 weeks before leave start
- Additional up to 4 weeks unpaid for pregnancy/childbirth complications

**Paternity Leave**

- Duration: 5 days paid (per child)
- Pay rate: 4/5 of daily average wage
- Eligibility: Employed continuously for ≥40 weeks before leave

**Statutory Holidays (14 per year)**

- New Year's Day (1 Jan)
- Lunar New Year's Day + 2nd + 3rd day
- Ching Ming Festival
- Labour Day (1 May)
- Birthday of the Buddha
- Tuen Ng Festival
- HKSAR Establishment Day (1 Jul)
- National Day (1 Oct)
- Day after Chinese Mid-Autumn Festival
- Chung Yeung Festival
- Christmas Day or Chinese Winter Solstice (employer's option)
- First weekday after Christmas Day

#### 4.3.2 Leave Categories

**System-defined (SuperAdmin managed):**
| Code | Name | Paid | HK Statutory |
|---|---|---|---|
| ANNUAL | Annual Leave | Yes | Yes (7–14 days) |
| SICK | Sick Leave | Partial (4/5 after day 4) | Yes (120 days max) |
| MATERNITY | Maternity Leave | Yes (4/5) | Yes (14 weeks) |
| PATERNITY | Paternity Leave | Yes (4/5) | Yes (5 days) |
| STATUTORY | Statutory Holiday | Yes (full) | Yes (14 days) |
| UNPAID | Unpaid Leave | No | No |
| COMPASSIONATE | Compassionate Leave | Company policy | No |
| MARRIAGE | Marriage Leave | Company policy | No |
| BIRTHDAY | Birthday Leave | Company policy | No |

**User-created custom categories:**

- Staff can create a custom leave category if no existing one fits their need
- Custom categories are flagged as `is_custom = true, created_by = staff_id`
- Admin must approve a custom leave request before it affects the leave balance
- Admin can convert approved custom categories into system-wide categories

#### 4.3.3 Leave Request Flow

```
Staff → Creates Leave Request (category, dates, reason, attachments)
       ↓
Admin notified (in-app notification)
       ↓
Admin: Approve / Reject (with note)
       ↓
Staff notified of outcome
       ↓
If Approved → Leave balance deducted, calendar updated
```

**Leave Request fields:** `id, staff_id, restaurant_id, leave_category_id, start_date, end_date, days_requested, reason, attachment_url, status (PENDING/APPROVED/REJECTED), reviewed_by, review_note, reviewed_at, created_at`

#### 4.3.4 Leave Balance

- Each staff member has a `LeaveBalance` record per category per year
- SuperAdmin sets default annual allocations (e.g., 7 days Annual Leave for Year 1)
- System auto-increments annual leave entitlement based on years of service
- Balance = Allocated - Used

### 4.4 Salary & Payroll

#### 4.4.1 Salary Configuration Hierarchy

```
Restaurant Defaults (hourly rate per staff category)
    └── Staff Category Override (e.g., all Waiters at Restaurant A = HK$65/hr)
        └── Individual Override (specific person at a custom rate)
```

Priority: Individual Rate > Category Rate > Restaurant Default Rate

#### 4.4.2 Staff Categories (configurable per restaurant)

- Manager / Assistant Manager
- Head Waiter / Senior Waiter / Waiter
- Part-time Waiter
- Kitchen Staff (Head Chef / Sous Chef / Line Cook / Kitchen Helper)
- Cashier / Host
- Cleaner
- (Custom categories can be added)

#### 4.4.3 Payroll Calculation

```
Payroll for a period =
  Σ (daily_hours_worked × hourly_rate)
  + Leave pay (if applicable, at 4/5 rate for statutory leaves)
  + Statutory holiday pay (if entitled — continuous contract ≥3 months)
  - Deductions (if applicable)
```

**SalaryRate fields:** `id, staff_id (nullable), category_id (nullable), restaurant_id, hourly_rate, effective_from, effective_to, created_by, created_at`

#### 4.4.4 Report Generation

**Report Types:**

1. **Individual Staff Report** — attendance + leave + earnings for date range
2. **Restaurant Report** — all staff within a restaurant for a period
3. **Cross-Restaurant Report** — SuperAdmin only, across all restaurants

**Report Periods:** Weekly (Mon–Sun) · Monthly (1st–last day) · Custom date range

**Report Contents:**

- Staff info (name, category, restaurant)
- Total hours worked
- Regular hours vs overtime (>8 hrs/day or >44 hrs/week per HK standard)
- Leave days taken (by category)
- Gross earnings
- Statutory holiday pay
- Leave pay
- Total payable

**Export formats:** PDF (for payslips) · CSV (for accounting)

---

## 5. Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── ENUMS ────────────────────────────────────────────────────────────────────

enum Role {
  SUPER_ADMIN
  ADMIN
  STAFF
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum LeavePayType {
  FULL
  FOUR_FIFTHS
  UNPAID
}

// ─── CORE MODELS ──────────────────────────────────────────────────────────────

model User {
  id                   String          @id @default(cuid())
  email                String          @unique
  name                 String
  nickname             String?
  phone                String?
  avatarUrl            String?
  role                 Role            @default(STAFF)
  employmentType       EmploymentType  @default(FULL_TIME)
  hireDate             DateTime
  isActive             Boolean         @default(true)
  restaurantId         String?
  restaurant           Restaurant?     @relation(fields: [restaurantId], references: [id])
  categoryId           String?
  staffCategory        StaffCategory?  @relation(fields: [categoryId], references: [id])
  // Identity & banking (for payroll export)
  hkid                 String?
  bankName             String?
  bankCode             String?
  bankAccountNumber    String?
  // Payroll config
  staffNumber          String?
  autopayDay           Int?
  foodAllowance        Decimal?        @db.Decimal(10, 2)
  monthlySalary        Decimal?        @db.Decimal(10, 2)
  incentive            Decimal?        @db.Decimal(10, 2)
  monthlyDeduction     Decimal?        @db.Decimal(10, 2)
  monthlyAdjustment    Decimal?        @db.Decimal(10, 2)
  attendances          Attendance[]
  leaveRequests        LeaveRequest[]
  leaveBalances        LeaveBalance[]
  salaryRates          SalaryRate[]
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt
}

model Restaurant {
  id              String          @id @default(cuid())
  name            String
  address         String?
  cuisineType     String?
  description     String?
  logoUrl         String?
  isActive        Boolean         @default(true)
  staff           User[]
  categories      StaffCategory[]
  attendances     Attendance[]
  leaveRequests   LeaveRequest[]
  salaryRates     SalaryRate[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model StaffCategory {
  id            String      @id @default(cuid())
  name          String
  restaurantId  String
  restaurant    Restaurant  @relation(fields: [restaurantId], references: [id])
  staff         User[]
  salaryRates   SalaryRate[]
  createdAt     DateTime    @default(now())
}

model Attendance {
  id                  String      @id @default(cuid())
  staffId             String
  staff               User        @relation(fields: [staffId], references: [id])
  restaurantId        String
  restaurant          Restaurant  @relation(fields: [restaurantId], references: [id])
  date                DateTime    @db.Date
  entryTime           DateTime
  exitTime            DateTime?
  durationMinutes     Int?
  isManualCorrection  Boolean     @default(false)
  correctedBy         String?
  correctionNote      String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
}

model LeaveCategory {
  id              String          @id @default(cuid())
  code            String          @unique
  name            String
  description     String?
  isStatutory     Boolean         @default(false)
  isPaid          Boolean         @default(true)
  payType         LeavePayType    @default(FULL)
  maxDaysPerYear  Int?
  isCustom        Boolean         @default(false)
  createdBy       String?
  isActive        Boolean         @default(true)
  leaveRequests   LeaveRequest[]
  leaveBalances   LeaveBalance[]
  createdAt       DateTime        @default(now())
}

model LeaveRequest {
  id              String          @id @default(cuid())
  staffId         String
  staff           User            @relation(fields: [staffId], references: [id])
  restaurantId    String
  restaurant      Restaurant      @relation(fields: [restaurantId], references: [id])
  categoryId      String
  category        LeaveCategory   @relation(fields: [categoryId], references: [id])
  startDate       DateTime        @db.Date
  endDate         DateTime        @db.Date
  daysRequested   Float
  reason          String?
  attachmentUrl   String?
  status          LeaveStatus     @default(PENDING)
  reviewedBy      String?
  reviewNote      String?
  reviewedAt      DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model LeaveBalance {
  id              String          @id @default(cuid())
  staffId         String
  staff           User            @relation(fields: [staffId], references: [id])
  categoryId      String
  category        LeaveCategory   @relation(fields: [categoryId], references: [id])
  year            Int
  allocated       Float
  used            Float           @default(0)
  pending         Float           @default(0)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([staffId, categoryId, year])
}

model SalaryRate {
  id            String          @id @default(cuid())
  restaurantId  String
  restaurant    Restaurant      @relation(fields: [restaurantId], references: [id])
  staffId       String?
  staff         User?           @relation(fields: [staffId], references: [id])
  categoryId    String?
  category      StaffCategory?  @relation(fields: [categoryId], references: [id])
  hourlyRate    Decimal         @db.Decimal(10, 2)
  effectiveFrom DateTime        @db.Date
  effectiveTo   DateTime?       @db.Date
  createdBy     String
  createdAt     DateTime        @default(now())
}
```

---

## 6. API Routes (Next.js App Router)

```
/api/auth/me                    GET current user (role, name, restaurantId)

/api/restaurants                GET (list), POST (create)
/api/restaurants/[id]           GET, PATCH, DELETE
/api/restaurants/[id]/staff     GET all staff
/api/restaurants/[id]/categories  GET, POST staff categories

/api/staff                      GET (list), POST (create — includes HKID + bank fields)
/api/staff/[id]                 GET, PATCH (edit — includes HKID + bank), DELETE
/api/staff/[id]/attendance      GET attendance history
/api/staff/[id]/leaves          GET leave history
/api/staff/[id]/earnings        GET earnings summary

/api/attendance/punch-in        POST (server timestamp)
/api/attendance/punch-out       POST (server timestamp)
/api/attendance/today           GET current day status for logged-in staff
/api/attendance/history         GET history (start, end, staffId, limit params)
/api/attendance/[id]            PATCH (manual correction, admin only)

/api/leaves/categories          GET, POST (admin), PATCH, DELETE
/api/leaves/requests            GET (filtered), POST (create request)
/api/leaves/requests/[id]       GET, PATCH (approve/reject)
/api/leaves/balance             GET leave balances for logged-in staff

/api/salary/rates               GET, POST
/api/salary/rates/[id]          PATCH, DELETE
/api/salary/calculate           POST (calculate for a period)

/api/reports/generate           POST (individual / restaurant / all — JSON table data)
/api/reports/export             POST (PT payroll — PDF or Excel, 5-page/sheet)
/api/reports/payslip            POST (monthly payslip generator)

/api/dashboard/stats            GET (Admin: 14-day trend, today snapshot, staff presence)
                                    (SuperAdmin: restaurant comparison, network trend)

/api/seed                       POST { seedKey } — create demo data (public, key-gated)
/api/setup-auth                 POST { seedKey } — bulk create Supabase auth accounts (public, key-gated)
```

---

## 7. Page Structure (App Router)

```
app/
├── (auth)/
│   ├── login/                  Sign-in page
│   └── invite/[token]/         Accept invite & set password

├── (dashboard)/
│   ├── layout.tsx              Shared sidebar + topbar layout
│   ├── page.tsx                Redirect to /workspace or /dashboard

│   ├── workspace/              SuperAdmin — All restaurants overview
│   │   └── page.tsx

│   ├── restaurants/
│   │   ├── page.tsx            Restaurant list (SuperAdmin)
│   │   ├── new/page.tsx        Add restaurant form
│   │   └── [id]/
│   │       ├── page.tsx        Restaurant overview
│   │       ├── staff/page.tsx  Staff management
│   │       ├── attendance/page.tsx
│   │       ├── leaves/page.tsx
│   │       ├── salary/page.tsx
│   │       └── reports/page.tsx

│   ├── staff/
│   │   ├── page.tsx            Staff list (admin view)
│   │   └── [id]/page.tsx       Individual staff profile

│   ├── attendance/
│   │   └── page.tsx            Punch in/out + history (staff view)

│   ├── leaves/
│   │   ├── page.tsx            Leave requests + balance (staff view)
│   │   └── manage/page.tsx     Admin: approve/reject queue

│   ├── salary/
│   │   └── page.tsx            Salary config (admin/superadmin)

│   ├── reports/
│   │   └── page.tsx            Report generation

│   └── settings/
│       └── page.tsx            Profile, notifications, system settings
```

---

## 8. UI/UX Design System

### Color Palette

```
Background:       #0A0A0B  (near-black)
Surface:          #111113  (card background)
Surface-2:        #1A1A1E  (elevated surface)
Border:           #27272A  (subtle divider)
Primary:          #E8E8E8  (white-ish text)
Secondary:        #A1A1AA  (muted text)
Accent:           #F5A623  (Amazonia amber/gold — brand)
Accent-muted:     #F5A62320 (ghost accent)
Success:          #22C55E
Warning:          #EAB308
Danger:           #EF4444
Info:             #3B82F6
```

### Typography

- Font: `Inter` (sans-serif) for UI, `JetBrains Mono` for data/numbers
- Scale: 12 / 14 / 16 / 18 / 24 / 32 / 48px
- Weight: 400 (body) · 500 (label) · 600 (heading) · 700 (display)

### Component Patterns

- **Cards:** Dark surface with subtle border, hover:border-accent transition
- **Tables:** Zebra striping on dark background, sticky header
- **Buttons:** Primary = accent fill; Secondary = ghost border; Destructive = red
- **Badges:** Rounded pill — status colors (PENDING=yellow, APPROVED=green, REJECTED=red)
- **Modals/Drawers:** Right-side drawer for forms, center modal for confirmations
- **Navigation:** Left sidebar (collapsed on mobile to bottom nav)
- **Mobile:** Bottom navigation bar with 5 icons for staff; hamburger for admin

### Animation & Transitions

- Use `transition-all duration-200` for hover/focus states
- Page transitions: subtle fade-in via `animate-in fade-in-0 slide-in-from-bottom-2`
- Skeleton loaders during data fetching (never show empty states abruptly)
- Optimistic UI updates via TanStack Query for punch in/out and leave requests

---

## 9. TanStack Query Conventions

```typescript
// Query key factory pattern
export const queryKeys = {
  restaurants: {
    all: ["restaurants"] as const,
    byId: (id: string) => ["restaurants", id] as const,
    staff: (id: string) => ["restaurants", id, "staff"] as const,
  },
  attendance: {
    byStaff: (staffId: string) => ["attendance", staffId] as const,
    todayStatus: (staffId: string) => ["attendance", staffId, "today"] as const,
  },
  leaves: {
    requests: (filters?: object) => ["leaves", "requests", filters] as const,
    balance: (staffId: string, year: number) => ["leaves", "balance", staffId, year] as const,
    categories: ["leaves", "categories"] as const,
  },
  salary: {
    rates: (restaurantId: string) => ["salary", "rates", restaurantId] as const,
    earnings: (staffId: string) => ["salary", "earnings", staffId] as const,
  },
};

// All mutations must invalidate relevant queries
// All queries use staleTime: 30_000 minimum
// Critical real-time data (punch status) uses staleTime: 0
```

---

## 10. Hong Kong Employment Ordinance Compliance Checklist

- [ ] Annual leave auto-escalates per year of service (7→14 days over 8 years)
- [ ] Sick leave accumulates at 2 days/month, capped at 120 days
- [ ] Sick leave pay = 4/5 of daily average wage from day 5+
- [ ] Maternity leave = 14 weeks at 4/5 pay (eligibility: ≥40 weeks continuous)
- [ ] Paternity leave = 5 days at 4/5 pay (eligibility: ≥40 weeks continuous)
- [ ] 14 statutory holidays tracked and enforced
- [ ] Holiday pay = average daily wages (12-month average)
- [ ] Overtime indicator when >8 hrs/day or >44 hrs/week
- [ ] Part-time staff: statutory holidays apply after 3 months continuous service
- [ ] No monetary substitution for statutory holidays (system should enforce)
- [ ] All leave balances visible to staff at all times

---

## 11. Security & Data Architecture

- **Row-Level Security (RLS):** Supabase RLS policies ensure users only see their own restaurant's data
- **JWT Claims:** Role embedded in JWT, validated on every API route
- **Middleware:** Next.js middleware enforces role-based route protection
- **Audit Log:** All manual corrections, salary changes, and admin approvals are logged
- **Server-side timestamps:** All punch in/out times use `new Date()` on the server, never trust client time
- **File uploads:** Supabase Storage for avatars and leave attachments

---

## 12. Implementation Roadmap

### Phase 1 — Foundation ✅ Complete

1. ✅ Init Next.js 16 project with TypeScript, custom inline styles
2. ✅ Configure Supabase project (Auth + DB)
3. ✅ Define Prisma 7 schema with driver-adapter, run migrations
4. ✅ Implement auth: login, role-based middleware, Supabase SSR sessions
5. ✅ Layout: Sidebar, topbar, responsive shell

### Phase 2 — Core Features ✅ Complete

6. ✅ Restaurant CRUD (SuperAdmin)
7. ✅ Staff management (add, edit, HKID + bank fields, assign category)
8. ✅ Attendance: Punch in/out with server timestamp, history table
9. ✅ Leave categories (system-defined)
10. ✅ Leave request flow (create → approve/reject)
11. ✅ Leave balance management with HK statutory rules

### Phase 3 — Payroll ✅ Complete

12. ✅ Salary rate configuration (restaurant/category/individual)
13. ✅ Earnings calculation engine (hours × rate + leave pay)
14. ✅ Report generation (weekly PT / monthly FT)
15. ✅ PT Payroll PDF export (5 pages, jsPDF landscape)
16. ✅ PT Payroll Excel export (5 sheets, xlsx-js-style coloured cells)
17. ✅ Monthly payslip generator (3-up per A4, MPF included)

### Phase 4 — Analytics & Polish 🔄 In Progress

18. ✅ Professional dashboard with live charts (Recharts)
    - Staff: 30-day hours bar chart, quick stats, leave progress bars
    - Admin: 14-day attendance trend, today's snapshot donut, staff presence list
    - SuperAdmin: restaurant comparison, network trend line chart
19. ⬜ Admin notification system (leave requests, corrections)
20. ⬜ Mobile-first responsiveness audit
21. ⬜ Full-Time payroll export
22. ⬜ E2E testing with Playwright

---

## 13. Environment Variables

```env
# .env.local
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

---

## 14. Project Bootstrap Commands

```bash
# Init Next.js
npx create-next-app@latest amazonia-hr --typescript --tailwind --app --src-dir

# Add dependencies
npm install @prisma/client prisma
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form @hookform/resolvers zod
npm install recharts
npm install date-fns
npm install sonner
npm install lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-popover
npm install class-variance-authority clsx tailwind-merge
npm install next-auth@beta

# Shadcn/UI init
npx shadcn@latest init

# Prisma init
npx prisma init

# Generate Prisma client after schema setup
npx prisma generate
npx prisma db push
```

---

## 15. Key Business Rules Summary

| Rule               | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| Punch-in           | One active session per staff per day                          |
| Punch-out          | Must have an open punch-in to punch out                       |
| Leave overlap      | System rejects overlapping leave requests                     |
| Salary priority    | Individual > Category > Restaurant default                    |
| HK Annual Leave    | Min 7 days Year 1, +1/year, max 14 days                       |
| HK Sick Leave      | 2 days/month, max 120 days; paid from day 5 at 4/5 rate       |
| HK Maternity       | 14 weeks, 4/5 pay, need 40 weeks continuous service           |
| HK Paternity       | 5 days, 4/5 pay, need 40 weeks continuous service             |
| Statutory Holidays | 14/year, paid after 3 months continuous, no cash substitution |
| Custom Leave       | Staff-created, requires admin approval, auto-flags for review |
| Report export      | PDF for payslips, CSV for accounting                          |
| PT Payroll         | Weekly-based (Mon–Sun); OT threshold = 44 hrs/week            |
| FT Payroll         | Monthly-based (export disabled — coming soon)                 |

---

## 16. Payroll Export System (v2 — Implemented Feb 2026)

### 16.1 Employment-Type Payroll Logic

| Employment Type | Calculation Basis | Export Status    |
| --------------- | ----------------- | ---------------- |
| PART_TIME       | Weekly (Mon–Sun)  | ✅ Live           |
| FULL_TIME       | Monthly           | 🔒 Coming soon   |

### 16.2 Part-Time Weekly Calculation Rules

```
For each week (Monday → Sunday):
  total_hours    = Σ attendance.duration_minutes / 60
  regular_hours  = min(total_hours, 44)
  overtime_hours = max(total_hours - 44, 0)
  OT_MULTIPLIER  = 1.0 (configurable)
  weekly_pay     = (regular_hours × rate) + (overtime_hours × rate × OT_MULTIPLIER)

Leave pay (included in weekly grouping):
  STATUTORY HOLIDAY  → eligible if continuous service ≥ 3 months
  SICK LEAVE (SL)    → 4/5 rate if ≥ 4 consecutive days with medical cert
  ANNUAL LEAVE (AL)  → full rate
  UNPAID LEAVE (UPL) → no pay
```

### 16.3 Export API

**Endpoint:** `POST /api/reports/export`

```json
{
  "restaurantId": "string",
  "startDate":    "yyyy-MM-dd",
  "endDate":      "yyyy-MM-dd",
  "employmentType": "PART_TIME",
  "format": "PDF | EXCEL"
}
```

- Returns HTTP 400 if `employmentType !== "PART_TIME"`
- Returns HTTP 400 if no part-time staff found
- Returns HTTP 400 if no attendance records exist for the period
- Salary rate resolution: Individual > Category > Restaurant default

### 16.4 Export File Structure (5 pages / 5 sheets)

| # | Page / Sheet        | Orientation | Key Columns                                              |
|---|---------------------|-------------|----------------------------------------------------------|
| 1 | Salary Summary      | Portrait    | Name · Position · Hours · OT · Gross · Leave Pay · Net  |
| 2 | Attendance Grid     | Landscape   | Day 1–31 codes: F / OFF / SH / AL / SL · Summary cols   |
| 3 | Deduction Sheet     | Portrait    | HKID · Commencement · Deduction Reason · Days to Pay     |
| 4 | Bank Transfer       | Landscape   | Bank · Code · Account · Full Salary · OT Hrs             |
| 5 | Weekly Petty Cash   | Landscape   | Mon–Sun daily pay · Hourly Rate · Per Day Rate · Total   |

**Cell codes (Attendance Grid):**
- `F` = Worked (green)
- `SH` = Statutory Holiday (blue)
- `AL` = Annual Leave (yellow)
- `SL` = Sick Leave (red)
- `OFF` = Not scheduled

### 16.5 Frontend — Reports Page (`/dashboard/reports`)

- **Report Type** defaults to "All Staff (Restaurant)"
- **Employment Type** selector: Part-Time (default, weekly active) | Full-Time (disabled)
- **Part-Time Payroll Export** card is always visible when PT selected — shows 5 section previews
- **Export PDF (5 Pages)** / **Export Excel (5 Sheets)** buttons with loading overlay
- **Generate Report** button shows in-browser data table (CSV / basic PDF / basic Excel)
- Staff dropdown includes "All Staff" option → generates restaurant-level report

### 16.6 Implementation Files

| File | Purpose |
|------|---------|
| `app/api/reports/export/route.ts` | PT payroll data API with weekly grouping |
| `lib/export-pt-pdf.ts` | 5-page jsPDF generator (portrait + landscape per page) |
| `lib/export-pt-excel.ts` | 5-sheet XLSX generator with frozen headers |
| `app/(dashboard)/reports/page.tsx` | Reports UI with Employment Type selector |
| `components/ui/select.tsx` | Updated: supports `disabled` per option |

### 16.7 Constraints

- Server-side timestamps only — never trust client time
- Weekly calculation never mixes staff from different restaurants
- No schema changes required — all grouping is in-memory
- Full-Time export must be rejected at API level (HTTP 400)

---

---

## 17. Professional Dashboard Analytics (v3 — Implemented Feb 2026)

### 17.1 Overview

The dashboard renders role-specific live charts and stats powered by a dedicated `/api/dashboard/stats` endpoint and Recharts v3. All data is fetched via the `useDashboardStats()` TanStack Query hook (1-minute stale time, 2-minute refetch interval).

### 17.2 Staff View

| Widget | Type | Data Source |
|--------|------|-------------|
| Punch In / Out button | Interactive | `useTodayAttendance` + `usePunchIn/Out` |
| Quick Stats row | Stat tiles | Computed from 30-day `useAttendanceHistory` |
| My Work Hours | Bar chart | 30-day history; bars coloured blue (≤8h) / orange (OT >8h) |
| Leave Balances | Progress cards | `useLeaveBalance`; progress bar green→yellow→red |

**Quick Stats computed client-side from attendance history:**
- Hours This Week (Mon–Sun)
- Days Attended This Month
- OT Hours This Month (minutes > 480 per day)

### 17.3 Admin View

| Widget | Type | Data Source |
|--------|------|-------------|
| Total Staff | Stat card | `/api/dashboard/stats` |
| Present Today | Stat card + trend | `/api/dashboard/stats` |
| On Leave | Stat card | `/api/dashboard/stats` |
| Pending Leaves | Stat card | `/api/dashboard/stats` |
| 14-Day Attendance Trend | Area chart | Rate % per day, gradient fill |
| Today's Snapshot | Donut chart | Present / On Leave / Absent with center count |
| Today's Staff | Presence list | Name · clock-in/out · duration · status badge |

### 17.4 SuperAdmin View

| Widget | Type | Data Source |
|--------|------|-------------|
| Restaurants | Stat card | `useRestaurants` |
| Total Staff | Stat card | `/api/dashboard/stats` |
| Present Today | Stat card + trend | `/api/dashboard/stats` |
| Pending Leaves | Stat card | `/api/dashboard/stats` |
| Restaurant Comparison | Grouped bar chart | Total Staff vs Present vs On Leave per restaurant |
| Live Restaurant Status | Progress cards | Attendance rate % with coloured progress bar |
| 14-Day Network Trend | Multi-line chart | One line per restaurant (colour-coded) |

### 17.5 Dashboard Stats API

**Endpoint:** `GET /api/dashboard/stats`
**Auth:** ADMIN or SUPER_ADMIN only

- Uses batch `Promise.all` queries — no N+1 loops
- Attendance grouped by date in JS (single 14-day range query)
- Date matching uses UTC midnight pattern: `new Date(\`${y}-${m}-${d}T00:00:00.000Z\`)` (consistent with `@db.Date` fields)
- Leave overlap check: `startDate <= endOfToday AND endDate >= startOfToday`

### 17.6 Implementation Files

| File | Purpose |
|------|---------|
| `app/api/dashboard/stats/route.ts` | Stats API — ADMIN and SUPER_ADMIN branches |
| `hooks/use-dashboard.ts` | `useDashboardStats()` TanStack Query hook |
| `app/(dashboard)/dashboard/page.tsx` | Dashboard page — StaffDashboard, AdminDashboard, SuperAdminDashboard |

### 17.7 Chart Colour Reference

```
Present / Active:   #22C55E  (green)
On Leave:           #EAB308  (yellow)
Absent / Neutral:   #3F3F46  (dark zinc)
Regular Hours:      #3B82F6  (blue)
Overtime:           #F5A623  (orange — brand accent)
Restaurant 1:       #F5A623  (orange)
Restaurant 2:       #3B82F6  (blue)
Restaurant 3:       #22C55E  (green)
Restaurant 4:       #A855F7  (purple)
Chart grid:         #27272A
Axis labels:        #52525B
Tooltip bg:         #18181B
```

---

_Last updated: February 2026 | v3 Professional Dashboard added | v2 Payroll Export | Compliance basis: HK Employment Ordinance Cap. 57 (as amended up to 2025)_

Sources:

- [HK Labour Department — Employment Ordinance Cap. 57](https://www.labour.gov.hk/eng/faq/cap57h_whole.htm)
- [HK Leave Laws — Vacation Tracker](https://vacationtracker.io/leave-laws/asia/hong-kong/)
- [Leave Policy in Hong Kong 2025 — Skuad](https://www.skuad.io/leave-policy/hong-kong)
- [HK Statutory Holidays 2025 — Labour Department](https://www.labour.gov.hk/eng/news/latest_holidays2025.htm)
- [Annual Leave & Public Holidays HK — China Briefing](https://www.china-briefing.com/doing-business-guide/hong-kong/human-resources-and-payroll/statutory-holidays-in-hong-kong)
