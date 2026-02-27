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

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      include: {
        restaurant: { select: { id: true, name: true } },
        staffCategory: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      employmentType: user.employmentType,
      hireDate: user.hireDate,
      isActive: user.isActive,
      restaurantId: user.restaurantId,
      restaurant: user.restaurant,
      categoryId: user.categoryId,
      staffCategory: user.staffCategory,
    });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, avatarUrl } = body;

    const user = await prisma.user.update({
      where: { email: authUser.email! },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[PATCH /api/auth/me]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
