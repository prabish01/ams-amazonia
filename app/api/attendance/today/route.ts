import { NextResponse } from "next/server";
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
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayDate = new Date(`${y}-${mo}-${d}T00:00:00.000Z`);

    const attendance = await prisma.attendance.findFirst({
      where: {
        staffId: dbUser.id,
        date: todayDate,
      },
      orderBy: { entryTime: "desc" },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("[GET /api/attendance/today]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
