import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export const getCurrentUser = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      fullName: true,
      provider: true,
      socialId: true,
      userType: true,
      createdAt: true,
    },
  });
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
