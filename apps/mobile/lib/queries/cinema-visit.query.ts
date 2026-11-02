import { queryOptions } from "@tanstack/react-query";
import {
  getCinemaVisitsByVenue,
  getCinemaVists,
} from "@/lib/api/cinema-visits";

export const cinemaVisitKeys = {
  all: ["cinema-visits"] as const,
  list: () => [...cinemaVisitKeys.all, "list"] as const,
  venue: (venueId: string) =>
    [...cinemaVisitKeys.all, "venue", venueId] as const,
};

export const cinemaVisitsQueryOptions = (enabled = true) =>
  queryOptions({
    queryKey: cinemaVisitKeys.all,
    queryFn: ({ signal }) => getCinemaVists(signal),
    enabled,
    staleTime: 5 * 60_000,
  });

export const cinemaVisitsByVenueQueryOptions = (
  venueId: string,
  enabled = true,
) =>
  queryOptions({
    queryKey: cinemaVisitKeys.venue(venueId),
    queryFn: ({ signal }) => getCinemaVisitsByVenue(venueId, signal),
    enabled: enabled && venueId.trim().length > 0,
    staleTime: 5 * 60_000,
  });
