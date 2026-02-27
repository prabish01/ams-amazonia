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
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    // Role-based access
    if (dbUser.role === "STAFF") {
      where.staffId = dbUser.id;
    } else if (dbUser.role === "ADMIN" && dbUser.restaurantId) {
      where.restaurantId = dbUser.restaurantId;
    }

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (startDate) {
      where.startDate = {
        ...(where.startDate as object || {}),
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      where.endDate = {
        ...(where.endDate as object || {}),
        lte: new Date(endDate),
      };
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, avatarUrl: true, email: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("[GET /api/leaves/requests]", error);
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
      select: { id: true, restaurantId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!dbUser.restaurantId) {
      return NextResponse.json({ error: "Not assigned to a restaurant" }, { status: 400 });
    }

    const body = await request.json();
    const { categoryId, startDate, endDate, daysRequested, reason } = body;

    if (!categoryId || !startDate || !endDate || !daysRequested) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check leave balance
    const year = new Date(startDate).getFullYear();
    const balance = await prisma.leaveBalance.findFirst({
      where: {
        staffId: dbUser.id,
        categoryId,
        year,
      },
    });

    const remaining = balance ? balance.allocated - balance.used - balance.pending : 0;
    if (balance && remaining < daysRequested) {
      return NextResponse.json(
        { error: `Insufficient leave balance. You have ${remaining} days remaining.` },
        { status: 400 }
      );
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        staffId: dbUser.id,
        restaurantId: dbUser.restaurantId,
        categoryId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysRequested,
        reason,
        status: "PENDING",
      },
      include: {
        category: true,
        staff: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Update pending in balance
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: { increment: daysRequested },
        },
      });
    }

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error("[POST /api/leaves/requests]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
