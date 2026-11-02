import { queryOptions } from "@tanstack/react-query";

import { getActiveCurations } from "@/lib/api/curations";

export const activeCurationsQueryOptions = () =>
  queryOptions({
    queryKey: ["curations", "active"],
    queryFn: ({ signal }) => getActiveCurations(signal),
    staleTime: 60_000,
    retry: false,
  });
