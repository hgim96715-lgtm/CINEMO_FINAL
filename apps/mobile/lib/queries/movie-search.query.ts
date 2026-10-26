import { queryOptions } from "@tanstack/react-query";
import {
  searchMovies,
  getTmdbMovieDetail,
  searchTmdbMovies,
  type SearchMoviesParams,
} from "@/lib/api/movies";

export const movieSearchQueryOptions = (params: SearchMoviesParams) =>
  queryOptions({
    queryKey: ["movies", "search", params],
    queryFn: ({ signal }) => searchMovies(params, signal),
    enabled: params.query.trim().length > 0,
  });

export type TmdbMovieSearchParams = {
  query: string;
  page?: number;
  enabled?: boolean;
};

export const normalizeSearchText = (value: string) =>
  value.toLocaleLowerCase().replace(/\s+/g, "");

export const getMovieSearchKey = (
  title: string,
  releaseDate: string | null | undefined,
) => `${normalizeSearchText(title)}:${releaseDate?.slice(0, 4) ?? ""}`;

export const tmdbMovieSearchQueryOptions = ({
  query,
  page = 1,
  enabled = true,
}: TmdbMovieSearchParams) =>
  queryOptions({
    queryKey: ["tmdb", "movies", "search", query, page],
    queryFn: ({ signal }) => searchTmdbMovies(query, page, signal),
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60_000,
  });

export const tmdbMovieDetailQueryOptions = (tmdbMovieId: number) =>
  queryOptions({
    queryKey: ["tmdb", "movies", "detail", tmdbMovieId],
    queryFn: ({ signal }) => getTmdbMovieDetail(tmdbMovieId, signal),
    staleTime: 30 * 60_000,
  });
