import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
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

    // Server-side timestamp — NEVER trust client
    const now = new Date();
    // Build today's date as YYYY-MM-DD using local time, then parse as UTC midnight
    // This ensures the stored DATE value matches the local calendar date regardless of server timezone
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayDate = new Date(`${y}-${m}-${d}T00:00:00.000Z`);

    // Check for existing open session (punched in, not yet punched out)
    const existing = await prisma.attendance.findFirst({
      where: {
        staffId: dbUser.id,
        date: todayDate,
        exitTime: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have an active session. Please punch out first." },
        { status: 409 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        staffId: dbUser.id,
        restaurantId: dbUser.restaurantId,
        date: todayDate,
        entryTime: now,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("[POST /api/attendance/punch-in]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
