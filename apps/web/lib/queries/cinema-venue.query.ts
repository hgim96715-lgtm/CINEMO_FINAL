import { queryOptions } from "@tanstack/react-query";
import { getCinemaVenues, type GetCinemaVenuesParams } from "@/lib/api/map";

export const cinemaVenuesQueryOptions = (params: GetCinemaVenuesParams = {}) =>
  queryOptions({
    queryKey: ["map", "cinemas", params],
    queryFn: ({ signal }) => getCinemaVenues(params, signal),
    staleTime: 5 * 60_000,
  });
