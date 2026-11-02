import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/server";

export default async function AdminCurationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return children;
}
