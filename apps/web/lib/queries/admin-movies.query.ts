import { queryOptions } from "@tanstack/react-query";

import {
  searchAdminMovies,
  type AdminMovieVisibility,
} from "@/lib/api/admin-movies";

export const adminMoviesQueryOptions = (params: {
  query: string;
  visibility: AdminMovieVisibility;
}) =>
  queryOptions({
    queryKey: ["admin", "movies", params.visibility, params.query],
    queryFn: () => searchAdminMovies(params),
    enabled: params.query.trim().length > 0,
    retry: false,
  });
