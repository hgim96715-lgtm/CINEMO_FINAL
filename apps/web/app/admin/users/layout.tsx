import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/server";

export default async function AdminUsersLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return children;
}
