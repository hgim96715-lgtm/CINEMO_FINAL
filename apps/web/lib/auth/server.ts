import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { AuthUser } from "@/lib/api/auth";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3050";

const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-cinemo_session"
    : "cinemo_session";

export const getServerUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const response = await fetch(`${API_URL}/v1/auth/me`, {
    headers: {
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`인증 조회 실패: ${response.status}`);
  }

  return response.json() as Promise<AuthUser>;
});

export async function requireUser(): Promise<AuthUser> {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
