import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWorkingDays(daysBack: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = daysBack; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(d);
  }
  return days;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const RESTAURANTS = [
  {
    name: "Joe Bananas",
    address: "23 D'Aguilar St, Lan Kwai Fong, Central, Hong Kong",
    cuisineType: "Bar & Grill",
    description: "A legendary bar and grill in the heart of Lan Kwai Fong, serving western comfort food and craft beers since 1985.",
    rates: { Manager: 200, Chef: 170, Server: 110, Bartender: 130, Host: 100 },
    staff: [
      { name: "Marcus Leung",    email: "marcus.leung@joebananas.hk",    phone: "+852 9111 2200", cat: "Manager",   emp: "FULL_TIME", role: "ADMIN"  },
      { name: "Cheung Wai Kin",  email: "waikin.cheung@joebananas.hk",   phone: "+852 9222 3311", cat: "Chef",      emp: "FULL_TIME", role: "STAFF"  },
      { name: "Priya Sharma",    email: "priya.sharma@joebananas.hk",    phone: "+852 9333 4422", cat: "Chef",      emp: "FULL_TIME", role: "STAFF"  },
      { name: "Wong Siu Ting",   email: "siuting.wong@joebananas.hk",    phone: "+852 9444 5533", cat: "Server",    emp: "FULL_TIME", role: "STAFF"  },
      { name: "Chan Ho Yan",     email: "hoyan.chan@joebananas.hk",      phone: "+852 9555 6644", cat: "Server",    emp: "PART_TIME", role: "STAFF"  },
      { name: "Lee Ka Wai",      email: "kawai.lee@joebananas.hk",       phone: "+852 9666 7755", cat: "Server",    emp: "PART_TIME", role: "STAFF"  },
      { name: "James Morrison",  email: "james.morrison@joebananas.hk",  phone: "+852 9777 8866", cat: "Bartender", emp: "FULL_TIME", role: "STAFF"  },
      { name: "Tse Mei Ling",   email: "meiling.tse@joebananas.hk",     phone: "+852 9888 9977", cat: "Bartender", emp: "FULL_TIME", role: "STAFF"  },
      { name: "Liu Xiao Feng",  email: "xiaofeng.liu@joebananas.hk",    phone: "+852 9100 1188", cat: "Host",      emp: "PART_TIME", role: "STAFF"  },
      { name: "Olivia Tang",    email: "olivia.tang@joebananas.hk",     phone: "+852 9200 2299", cat: "Host",      emp: "PART_TIME", role: "STAFF"  },
    ],
  },
  {
    name: "Pitstop",
    address: "8 Observatory Rd, Tsim Sha Tsui, Kowloon, Hong Kong",
    cuisineType: "Western",
    description: "A casual dining spot and sports bar in TST — great food, cold beers and live sport on every screen.",
    rates: { Manager: 190, Chef: 165, Server: 105, Bartender: 125, Host: 98 },
    staff: [
      { name: "Sarah Chan",      email: "sarah.chan@pitstop.hk",         phone: "+852 9311 3300", cat: "Manager",   emp: "FULL_TIME", role: "ADMIN"  },
      { name: "Kwok Chi Wai",   email: "chiwai.kwok@pitstop.hk",        phone: "+852 9422 4411", cat: "Chef",      emp: "FULL_TIME", role: "STAFF"  },
      { name: "Ahmed Hassan",    email: "ahmed.hassan@pitstop.hk",       phone: "+852 9533 5522", cat: "Chef",      emp: "FULL_TIME", role: "STAFF"  },
      { name: "Ng Sze Wing",    email: "szewing.ng@pitstop.hk",         phone: "+852 9644 6633", cat: "Server",    emp: "FULL_TIME", role: "STAFF"  },
      { name: "Lam Hoi Ting",  email: "hoiting.lam@pitstop.hk",        phone: "+852 9755 7744", cat: "Server",    emp: "PART_TIME", role: "STAFF"  },
      { name: "Peter Yuen",     email: "peter.yuen@pitstop.hk",         phone: "+852 9866 8855", cat: "Server",    emp: "PART_TIME", role: "STAFF"  },
      { name: "Fung Ka Lok",    email: "kalok.fung@pitstop.hk",         phone: "+852 9977 9966", cat: "Bartender", emp: "FULL_TIME", role: "STAFF"  },
      { name: "Isabella Torres", email: "isabella.torres@pitstop.hk",   phone: "+852 9010 0011", cat: "Bartender", emp: "FULL_TIME", role: "STAFF"  },
      { name: "Ho Siu Wai",     email: "siuwai.ho@pitstop.hk",          phone: "+852 9120 1122", cat: "Host",      emp: "PART_TIME", role: "STAFF"  },
      { name: "Yip Pui Shan",  email: "puishan.yip@pitstop.hk",        phone: "+852 9230 2233", cat: "Host",      emp: "PART_TIME", role: "STAFF"  },
    ],
  },
  {
    name: "Amazonia Bar",
    address: "LG/F, California Tower, 32 D'Aguilar St, Central, Hong Kong",
    cuisineType: "Bar & Grill",
    description: "Amazonia Bar brings the vibrant spirit of South America to Hong Kong — bold cocktails, live Latin music, and fiery grilled flavours.",
    rates: { Manager: 195, Chef: 160, Server: 108, Bartender: 128, Host: 99 },
    staff: [
      { name: "Daniel Mak",       email: "daniel.mak@amazoniabar.hk",      phone: "+852 9341 3344", cat: "Manager",   emp: "FULL_TIME", role: "ADMIN"  },
      { name: "Lin Zhong Ying",  email: "zhongying.lin@amazoniabar.hk",   phone: "+852 9452 4455", cat: "Chef",      emp: "FULL_TIME", role: "STAFF"  },
      { name: "Rachel Fernandez", email: "rachel.fernandez@amazoniabar.hk", phone: "+852 9563 5566", cat: "Chef",    emp: "FULL_TIME", role: "STAFF"  },
      { name: "Chow Kin Fung",   email: "kinfung.chow@amazoniabar.hk",    phone: "+852 9674 6677", cat: "Server",    emp: "FULL_TIME", role: "STAFF"  },
      { name: "Wu Mei Yee",      email: "meiyee.wu@amazoniabar.hk",       phone: "+852 9785 7788", cat: "Server",    emp: "PART_TIME", role: "STAFF"  },
      { name: "Kevin Lau",        email: "kevin.lau@amazoniabar.hk",       phone: "+852 9896 8899", cat: "Server",    emp: "PART_TIME", role: "STAFF"  },
      { name: "Ricky Tam",        email: "ricky.tam@amazoniabar.hk",       phone: "+852 9907 9900", cat: "Bartender", emp: "FULL_TIME", role: "STAFF"  },
      { name: "Natasha Petrov",   email: "natasha.petrov@amazoniabar.hk",  phone: "+852 9018 0011", cat: "Bartender", emp: "FULL_TIME", role: "STAFF"  },
      { name: "Goh Weng Kiat",   email: "wengkiat.goh@amazoniabar.hk",    phone: "+852 9129 1122", cat: "Host",      emp: "PART_TIME", role: "STAFF"  },
      { name: "Amy Cheung",       email: "amy.cheung@amazoniabar.hk",      phone: "+852 9240 2244", cat: "Host",      emp: "PART_TIME", role: "STAFF"  },
    ],
  },
] as const;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...\n");

  const currentYear = new Date().getFullYear();
  const workingDays = getWorkingDays(60); // ~42 working days

  // ── Leave categories (global, upsert) ──────────────────────────────────────
  console.log("📋 Leave categories...");
  const [annualCat, sickCat, birthdayCat] = await Promise.all([
    prisma.leaveCategory.upsert({
      where: { code: "AL" },
      update: {},
      create: {
        code: "AL", name: "Annual Leave",
        description: "Standard annual leave entitlement",
        isStatutory: true, isPaid: true, payType: "FULL",
        maxDaysPerYear: 14, isCustom: false, isActive: true,
      },
    }),
    prisma.leaveCategory.upsert({
      where: { code: "SL" },
      update: {},
      create: {
        code: "SL", name: "Sick Leave",
        description: "Paid sick leave with medical certificate",
        isStatutory: true, isPaid: true, payType: "FOUR_FIFTHS",
        maxDaysPerYear: 14, isCustom: false, isActive: true,
      },
    }),
    prisma.leaveCategory.upsert({
      where: { code: "BL" },
      update: {},
      create: {
        code: "BL", name: "Birthday Leave",
        description: "One paid day off on your birthday",
        isStatutory: false, isPaid: true, payType: "FULL",
        maxDaysPerYear: 1, isCustom: true, isActive: true,
      },
    }),
  ]);
  console.log("  ✓ Annual, Sick, Birthday leave categories ready\n");

  // ── Restaurants ────────────────────────────────────────────────────────────
  for (const rDef of RESTAURANTS) {
    console.log(`🏠 ${rDef.name}`);

    const restaurant = await prisma.restaurant.create({
      data: {
        name: rDef.name,
        address: rDef.address,
        cuisineType: rDef.cuisineType,
        description: rDef.description,
        isActive: true,
      },
    });

    // Categories
    const catNames = ["Manager", "Chef", "Server", "Bartender", "Host"] as const;
    const catMap: Record<string, string> = {};
    for (const catName of catNames) {
      const c = await prisma.staffCategory.create({
        data: { name: catName, restaurantId: restaurant.id },
      });
      catMap[catName] = c.id;
    }

    // Salary rates per category
    for (const [catName, rate] of Object.entries(rDef.rates)) {
      await prisma.salaryRate.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: catMap[catName],
          hourlyRate: rate,
          effectiveFrom: new Date(`${currentYear}-01-01`),
          createdBy: "seed",
        },
      });
    }
    console.log(`  ✓ Categories & salary rates set`);

    // Payroll lookup table by category
    const FT_PAYROLL: Record<string, { monthlySalary: number; foodAllowance: number }> = {
      Manager:   { monthlySalary: 28000, foodAllowance: 1500 },
      Chef:      { monthlySalary: 22000, foodAllowance: 1200 },
      Server:    { monthlySalary: 18000, foodAllowance: 800  },
      Bartender: { monthlySalary: 20000, foodAllowance: 1000 },
      Host:      { monthlySalary: 16000, foodAllowance: 600  },
    };

    // Staff
    let staffSeq = 1;
    for (const s of rDef.staff) {
      const hireDate = new Date(
        randInt(2022, 2024),
        randInt(0, 11),
        randInt(1, 28)
      );
      const payroll = FT_PAYROLL[s.cat] ?? null;
      const staffNumber = String(staffSeq++).padStart(3, "0");

      const user = await prisma.user.create({
        data: {
          email: s.email,
          name: s.name,
          phone: s.phone,
          role: s.role,
          employmentType: s.emp,
          hireDate,
          isActive: true,
          restaurantId: restaurant.id,
          categoryId: catMap[s.cat],
          staffNumber,
          autopayDay: 7,
          monthlySalary: s.emp === "FULL_TIME" && payroll ? payroll.monthlySalary : undefined,
          foodAllowance:  s.emp === "FULL_TIME" && payroll ? payroll.foodAllowance  : undefined,
        },
      });

      // ── Leave balances ─────────────────────────────────────────────────────
      const alAlloc   = s.emp === "FULL_TIME" ? 14 : 7;
      const alUsed    = randInt(0, 4);
      const alPending = randInt(0, 2);
      const slUsed    = randInt(0, 3);
      const blUsed    = randFrom([0, 0, 1]);

      await prisma.leaveBalance.createMany({
        data: [
          { staffId: user.id, categoryId: annualCat.id,   year: currentYear, allocated: alAlloc, used: alUsed,  pending: alPending },
          { staffId: user.id, categoryId: sickCat.id,     year: currentYear, allocated: 14,      used: slUsed,  pending: 0 },
          { staffId: user.id, categoryId: birthdayCat.id, year: currentYear, allocated: 1,       used: blUsed,  pending: 0 },
        ],
      });

      // ── Leave requests ─────────────────────────────────────────────────────
      const leaveReasons = [
        "Family gathering",
        "Medical appointment",
        "Personal matters",
        "Doctor visit",
        "Rest and recovery",
        null,
      ];
      const statuses = ["APPROVED", "APPROVED", "APPROVED", "PENDING", "REJECTED"] as const;
      const numRequests = randInt(1, 3);

      for (let i = 0; i < numRequests; i++) {
        const daysAgo  = randInt(5, 120);
        const start    = new Date();
        start.setDate(start.getDate() - daysAgo);
        start.setHours(0, 0, 0, 0);
        const days     = randInt(1, 3);
        const end      = new Date(start);
        end.setDate(start.getDate() + days - 1);
        const status   = randFrom(statuses);
        const leaveCat = randFrom([annualCat, sickCat]);

        await prisma.leaveRequest.create({
          data: {
            staffId:      user.id,
            restaurantId: restaurant.id,
            categoryId:   leaveCat.id,
            startDate:    start,
            endDate:      end,
            daysRequested: days,
            reason:       randFrom(leaveReasons),
            status,
            reviewedBy:   status !== "PENDING" ? "seed-admin" : null,
            reviewedAt:   status !== "PENDING" ? new Date() : null,
          },
        });
      }

      // ── Attendance ─────────────────────────────────────────────────────────
      // Shift start: 18:00 HKT (restaurants open evenings)
      // On time : entry 17:45 – 18:00
      // Late     : entry 18:10 – 19:00
      // Absent   : skip (~15% of days)

      for (const day of workingDays) {
        if (Math.random() < 0.15) continue; // ~15% absent

        const isLate       = Math.random() < 0.25; // 25% late
        const entryTime    = new Date(day);

        if (isLate) {
          entryTime.setHours(18, randInt(10, 59), randInt(0, 59), 0);
        } else {
          entryTime.setHours(17, randInt(45, 59), randInt(0, 59), 0);
        }

        const durationMinutes = randInt(6 * 60, 9 * 60); // 6-9 hour shift
        const exitTime = new Date(entryTime.getTime() + durationMinutes * 60 * 1000);

        await prisma.attendance.create({
          data: {
            staffId:          user.id,
            restaurantId:     restaurant.id,
            date:             day,
            entryTime,
            exitTime,
            durationMinutes,
            isManualCorrection: false,
          },
        });
      }
    }

    console.log(`  ✓ 10 staff seeded with attendance & leaves`);
    console.log();
  }

  console.log("✅ Seed complete!");
  console.log(`   3 restaurants · 30 staff · ~${workingDays.length * 30 * 0.85 | 0} attendance records`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
