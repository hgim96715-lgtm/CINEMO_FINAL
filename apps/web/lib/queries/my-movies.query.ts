import { queryOptions } from "@tanstack/react-query";

import { getMyMovies } from "@/lib/api/movies";

export const myMoviesQueryOptions = () =>
  queryOptions({
    queryKey: ["my-cinema", "movies"],
    queryFn: ({ signal }) => getMyMovies(signal),
    enabled: true,
    staleTime: 5 * 60_000,
  });
