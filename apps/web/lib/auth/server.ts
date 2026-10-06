import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthUser } from "@/lib/api/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3050";

export async function getServerUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("cinemo_session")?.value;

  if (!sessionToken) return null;

  const response = await fetch(`${API_URL}/v1/auth/me`, {
    headers: {
      Cookie: `cinemo_session=${sessionToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  return response.json() as Promise<AuthUser>;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
