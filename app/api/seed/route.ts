import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

/**
 * One-time seed endpoint — creates a SuperAdmin in both Supabase Auth + Prisma DB.
 * Protected by SEED_SECRET env var (or falls back to a hard-coded dev key).
 * Remove or disable this route after initial setup.
 */
export async function POST(request: NextRequest) {
  // Guard: only allow in development OR with the correct seed secret
  const body = await request.json();
  const { email, password, name, seedKey } = body;

  const expectedKey = process.env.SEED_SECRET ?? "amazonia-seed-2026";

  if (seedKey !== expectedKey) {
    return NextResponse.json({ error: "Invalid seed key" }, { status: 401 });
  }

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "email, password, and name are required" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // skip email confirmation flow
      });

    if (authError) {
      // If user already exists in Auth, still try to sync Prisma
      if (!authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: `Supabase Auth error: ${authError.message}` },
          { status: 400 }
        );
      }
    }

    const authUserId = authData?.user?.id;

    // 2. Upsert the user record in Prisma with SUPER_ADMIN role
    const dbUser = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        role: "SUPER_ADMIN",
        employmentType: "FULL_TIME",
        hireDate: new Date(),
        isActive: true,
      },
      update: {
        role: "SUPER_ADMIN",
        name,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: "SuperAdmin created successfully",
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          supabaseAuthId: authUserId ?? "(already existed)",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/seed]", error);
    return NextResponse.json(
      { error: "Internal server error", detail: String(error) },
      { status: 500 }
    );
  }
}
