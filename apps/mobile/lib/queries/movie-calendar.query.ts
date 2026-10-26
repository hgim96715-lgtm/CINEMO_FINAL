import { queryOptions } from "@tanstack/react-query";

import { getMovieCalendar } from "@/lib/api/my-cinema";

export const movieCalendarQueryOptions = (year: number, month: number) =>
  queryOptions({
    queryKey: ["my-cinema", "calendar", year, month],
    queryFn: ({ signal }) => getMovieCalendar({ year, month }, signal),
    staleTime: 60_000,
  });
