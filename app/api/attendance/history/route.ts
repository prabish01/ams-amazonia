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
      select: { id: true, role: true, restaurantId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const staffId = searchParams.get("staffId");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (dbUser.role === "STAFF") {
      where.staffId = dbUser.id;
    } else if (staffId) {
      where.staffId = staffId;
    } else if (dbUser.role === "ADMIN" && dbUser.restaurantId) {
      where.restaurantId = dbUser.restaurantId;
    }

    if (start && end) {
      where.date = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { date: "desc" },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("[GET /api/attendance/history]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
