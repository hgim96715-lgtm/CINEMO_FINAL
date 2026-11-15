import { requireAdmin } from "@/lib/auth/server";

import { AdminConversionsClient } from "./AdminConversionsClient";

export default async function AdminConversionsPage() {
  await requireAdmin();

  return <AdminConversionsClient />;
}
