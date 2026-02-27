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

    const categories = await prisma.leaveCategory.findMany({
      where: { isActive: true },
      orderBy: [{ isStatutory: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[GET /api/leaves/categories]", error);
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
      select: { id: true, role: true },
    });

    if (!dbUser || !["SUPER_ADMIN", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description, maxDaysPerYear, isPaid, isStatutory, payType } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
    }

    const existing = await prisma.leaveCategory.findFirst({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "A category with this code already exists" }, { status: 409 });
    }

    const category = await prisma.leaveCategory.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        maxDaysPerYear,
        isPaid: isPaid ?? true,
        isStatutory: isStatutory ?? false,
        payType: payType || "FULL",
        isCustom: !isStatutory,
        createdBy: dbUser.id,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("[POST /api/leaves/categories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
