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

    const restaurants = await prisma.restaurant.findMany({
      where: dbUser.role === "SUPER_ADMIN"
        ? undefined
        : dbUser.restaurantId
        ? { id: dbUser.restaurantId }
        : { id: "none" },
      include: {
        _count: { select: { staff: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error("[GET /api/restaurants]", error);
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
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, cuisineType, description, logoUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        address,
        cuisineType,
        description,
        logoUrl,
      },
      include: { _count: { select: { staff: true } } },
    });

    return NextResponse.json(restaurant, { status: 201 });
  } catch (error) {
    console.error("[POST /api/restaurants]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
