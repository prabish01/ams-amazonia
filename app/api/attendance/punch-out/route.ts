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

    // Server-side timestamp — NEVER trust client
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayDate = new Date(`${y}-${m}-${d}T00:00:00.000Z`);

    // Find the active session
    const activeSession = await prisma.attendance.findFirst({
      where: {
        staffId: dbUser.id,
        date: todayDate,
        exitTime: null,
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { error: "No active session found. Please punch in first." },
        { status: 404 }
      );
    }

    // Calculate duration in minutes (server-side)
    const durationMs = now.getTime() - activeSession.entryTime.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    const updated = await prisma.attendance.update({
      where: { id: activeSession.id },
      data: {
        exitTime: now,
        durationMinutes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/attendance/punch-out]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
