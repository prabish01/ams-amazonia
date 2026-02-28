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

    const staff = await prisma.user.findUnique({
      where: { id },
      include: {
        restaurant: { select: { id: true, name: true } },
        staffCategory: { select: { id: true, name: true } },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("[GET /api/staff/[id]]", error);
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
      select: { role: true },
    });

    if (!dbUser || !["SUPER_ADMIN", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, nickname, phone, hkid, bankName, bankCode, bankAccountNumber,
      role, employmentType, hireDate, restaurantId, categoryId, isActive, avatarUrl,
      // Payroll fields
      staffNumber, autopayDay, monthlySalary, foodAllowance, incentive, monthlyDeduction, monthlyAdjustment,
    } = body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nickname !== undefined && { nickname: nickname || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(hkid !== undefined && { hkid: hkid || null }),
        ...(bankName !== undefined && { bankName: bankName || null }),
        ...(bankCode !== undefined && { bankCode: bankCode || null }),
        ...(bankAccountNumber !== undefined && { bankAccountNumber: bankAccountNumber || null }),
        ...(role && { role }),
        ...(employmentType && { employmentType }),
        ...(hireDate && { hireDate: new Date(hireDate) }),
        ...(restaurantId !== undefined && { restaurantId }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isActive !== undefined && { isActive }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        // Payroll fields
        ...(staffNumber !== undefined && { staffNumber: staffNumber || null }),
        ...(autopayDay !== undefined && { autopayDay: autopayDay ? Number(autopayDay) : null }),
        ...(monthlySalary !== undefined && { monthlySalary: monthlySalary ? Number(monthlySalary) : null }),
        ...(foodAllowance !== undefined && { foodAllowance: foodAllowance ? Number(foodAllowance) : null }),
        ...(incentive !== undefined && { incentive: incentive ? Number(incentive) : null }),
        ...(monthlyDeduction !== undefined && { monthlyDeduction: monthlyDeduction ? Number(monthlyDeduction) : null }),
        ...(monthlyAdjustment !== undefined && { monthlyAdjustment: monthlyAdjustment ? Number(monthlyAdjustment) : null }),
      },
      include: {
        restaurant: { select: { id: true, name: true } },
        staffCategory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/staff/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
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
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft-delete: mark inactive
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/staff/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
