import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, name: true, avatarUrl: true, email: true } },
        category: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("[GET /api/leaves/requests/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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
      return NextResponse.json({ error: "Forbidden — only admins can review leave requests" }, { status: 403 });
    }

    const body = await request.json();
    const { status, reviewNote } = body;

    if (!["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const now = new Date();

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewNote,
        reviewedBy: dbUser.id,
        reviewedAt: now,
      },
      include: {
        staff: { select: { id: true, name: true, avatarUrl: true } },
        category: true,
      },
    });

    // Restore balance if rejected/cancelled (it was deducted on request creation)
    if (status === "REJECTED" || status === "CANCELLED") {
      const year = existing.startDate.getFullYear();
      const balance = await prisma.leaveBalance.findFirst({
        where: {
          staffId: existing.staffId,
          categoryId: existing.categoryId,
          year,
        },
      });

      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: { decrement: existing.daysRequested },
          },
        });
      }
    } else if (status === "APPROVED") {
      // Move from pending to used
      const year = existing.startDate.getFullYear();
      const balance = await prisma.leaveBalance.findFirst({
        where: {
          staffId: existing.staffId,
          categoryId: existing.categoryId,
          year,
        },
      });

      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: { decrement: existing.daysRequested },
            used: { increment: existing.daysRequested },
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/leaves/requests/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
