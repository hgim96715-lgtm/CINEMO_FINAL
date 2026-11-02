import { queryOptions } from "@tanstack/react-query";

import { getActiveCurations, getAdminCurations } from "@/lib/api/curations";

export const adminCurationsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "curations"],
    queryFn: getAdminCurations,
    retry: false,
  });

export const activeCurationsQueryOptions = () =>
  queryOptions({
    queryKey: ["curations", "active"],
    queryFn: getActiveCurations,
    staleTime: 60_000,
    retry: false,
  });
