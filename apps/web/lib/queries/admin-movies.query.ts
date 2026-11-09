import { queryOptions } from "@tanstack/react-query";

import {
  searchAdminMovies,
  type AdminMovieVisibilityFilter,
} from "@/lib/api/admin-movies";

export const adminMoviesQueryOptions = (params: {
  query: string;
  visibility: AdminMovieVisibilityFilter;
}) =>
  queryOptions({
    queryKey: ["admin", "movies", params.visibility, params.query],
    queryFn: () => searchAdminMovies(params),
    enabled: params.query.trim().length > 0,
    retry: false,
  });
