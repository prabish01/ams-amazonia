import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

/**
 * One-time setup endpoint — creates Supabase Auth accounts for all seeded Prisma users.
 * Each user's password is set to their email prefix + "@Amazonia2026"
 * e.g. marcus.leung@joebananas.hk → password: "marcus.leung@Amazonia2026"
 * Protected by SEED_SECRET env var.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { seedKey } = body;

  const expectedKey = process.env.SEED_SECRET ?? "amazonia-seed-2026";
  if (seedKey !== expectedKey) {
    return NextResponse.json({ error: "Invalid seed key" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  const results: { email: string; status: string; error?: string }[] = [];

  for (const user of users) {
    // Derive a deterministic password from the email prefix
    const emailPrefix = user.email.split("@")[0];
    const password = `${emailPrefix}@Amazonia2026`;

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.toLowerCase().includes("already been registered") ||
          error.message.toLowerCase().includes("already registered")) {
        results.push({ email: user.email, status: "already_exists" });
      } else {
        results.push({ email: user.email, status: "error", error: error.message });
      }
    } else {
      results.push({ email: user.email, status: "created" });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const existing = results.filter((r) => r.status === "already_exists").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    message: `Auth setup complete: ${created} created, ${existing} already existed, ${errors} errors`,
    summary: { created, existing, errors, total: users.length },
    details: results,
    passwordNote: "Each user's password is: {email_prefix}@Amazonia2026 (e.g. marcus.leung@Amazonia2026)",
  });
}
