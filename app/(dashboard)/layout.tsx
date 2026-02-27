import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DashboardLayoutClient } from "./layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      restaurantId: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const user = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role as "SUPER_ADMIN" | "ADMIN" | "STAFF",
    avatarUrl: dbUser.avatarUrl,
    restaurantId: dbUser.restaurantId,
  };

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>;
}
