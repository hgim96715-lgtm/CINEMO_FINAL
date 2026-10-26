"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

import {logout as logoutRequest} from "@/lib/api/auth";
import {useAuthStore} from "@/stores/auth.store";

export function LogoutButton() {
  const router = useRouter();
  const clearUser = useAuthStore((state) => state.clearUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logoutRequest();
    } finally {
      clearUser();
      router.replace("/lobby");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="shrink-0 text-sm text-cinemo-muted transition hover:text-cinemo-gold-light disabled:opacity-50"
    >
      {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
