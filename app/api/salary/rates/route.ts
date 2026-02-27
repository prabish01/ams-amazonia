import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { role: true, restaurantId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId") || dbUser.restaurantId;
    const staffId = searchParams.get("staffId");

    const now = new Date();

    const rates = await prisma.salaryRate.findMany({
      where: {
        ...(restaurantId ? { restaurantId } : {}),
        ...(staffId ? { staffId } : {}),
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
        effectiveFrom: { lte: now },
      },
      include: {
        staff: { select: { id: true, name: true, avatarUrl: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { effectiveFrom: "desc" },
    });

    return NextResponse.json(rates);
  } catch (error) {
    console.error("[GET /api/salary/rates]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, role: true, restaurantId: true },
    });

    if (!dbUser || !["SUPER_ADMIN", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { hourlyRate, staffId, categoryId, restaurantId, effectiveTo } = body;

    if (!hourlyRate) {
      return NextResponse.json({ error: "hourlyRate is required" }, { status: 400 });
    }

    const targetRestaurantId = restaurantId || dbUser.restaurantId;
    if (!targetRestaurantId) {
      return NextResponse.json({ error: "restaurantId is required" }, { status: 400 });
    }

    const now = new Date();

    // Expire any current matching rates
    await prisma.salaryRate.updateMany({
      where: {
        restaurantId: targetRestaurantId,
        ...(staffId ? { staffId } : { staffId: null }),
        ...(categoryId ? { categoryId } : { categoryId: null }),
        effectiveTo: null,
      },
      data: { effectiveTo: now },
    });

    const rate = await prisma.salaryRate.create({
      data: {
        restaurantId: targetRestaurantId,
        staffId: staffId || null,
        categoryId: categoryId || null,
        hourlyRate: hourlyRate.toString(),
        effectiveFrom: now,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        createdBy: dbUser.id,
      },
      include: {
        staff: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    console.error("[POST /api/salary/rates]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
