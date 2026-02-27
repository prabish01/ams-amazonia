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
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const staffIdParam = searchParams.get("staffId");
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Admins can query any staff, staff can only see themselves
    const staffId =
      dbUser.role === "STAFF"
        ? dbUser.id
        : staffIdParam || dbUser.id;

    const balances = await prisma.leaveBalance.findMany({
      where: {
        staffId,
        year,
      },
      include: {
        category: true,
      },
      orderBy: { category: { name: "asc" } },
    });

    return NextResponse.json(balances);
  } catch (error) {
    console.error("[GET /api/leaves/balance]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
