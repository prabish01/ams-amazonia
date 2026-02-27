import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const staff = await prisma.user.findMany({
      where: dbUser.role === "SUPER_ADMIN"
        ? {}
        : dbUser.restaurantId
        ? { restaurantId: dbUser.restaurantId }
        : { id: "none" },
      include: {
        restaurant: { select: { id: true, name: true } },
        staffCategory: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("[GET /api/staff]", error);
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
      select: { role: true, restaurantId: true },
    });

    if (!dbUser || !["SUPER_ADMIN", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, role, employmentType, hireDate, restaurantId, categoryId } = body;

    if (!name || !email || !hireDate) {
      return NextResponse.json({ error: "Name, email, and hire date are required" }, { status: 400 });
    }

    const targetRestaurantId = restaurantId || dbUser.restaurantId;

    // Create Supabase auth user via invite (in real scenario)
    // For now, create only the DB record
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const newStaff = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role: role || "STAFF",
        employmentType: employmentType || "FULL_TIME",
        hireDate: new Date(hireDate),
        restaurantId: targetRestaurantId,
        categoryId,
      },
      include: {
        restaurant: { select: { id: true, name: true } },
        staffCategory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    console.error("[POST /api/staff]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
