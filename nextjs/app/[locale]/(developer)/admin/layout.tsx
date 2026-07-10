import { notFound } from "next/navigation";

import { requireCurrentUser } from "@/lib/server/current-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();

  if (user.userType !== "admin") {
    notFound();
  }

  return children;
}
