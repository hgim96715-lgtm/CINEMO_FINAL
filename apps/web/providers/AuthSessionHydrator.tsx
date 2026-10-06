"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { authMeQueryOptions } from "@/lib/queries/auth.query";
import { useAuthStore } from "@/stores/auth.store";

type AuthSessionHydratorProps = {
  children: ReactNode;
};

export function AuthSessionHydrator({ children }: AuthSessionHydratorProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const meQuery = useQuery(authMeQueryOptions());

  useEffect(() => {
    if (meQuery.isSuccess) {
      setUser(meQuery.data);
    }
    if (meQuery.isError) {
      clearUser();
    }
  }, [clearUser, meQuery.data, meQuery.isError, meQuery.isSuccess, setUser]);
  return children;
}
