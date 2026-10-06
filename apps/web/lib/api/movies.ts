import type {
  MovieResponse,
  MovieSearchResponse,
  SearchTmdbMoviesResponse,
  UserMovieRecordResponse,
} from "@cinemo/api-contract";
import { apiClient } from "./apiClient";

export type SearchMoviesParams = {
  query: string;
  page?: number;
  limit?: number;
};

export async function searchMovies(
  params: SearchMoviesParams,
  signal?: AbortSignal,
): Promise<MovieSearchResponse> {
  const { data } = await apiClient.get<MovieSearchResponse>("/movies/search", {
    params: {
      query: params.query,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    },
    signal,
  });

  return data;
}

export async function searchTmdbMovies(
  query: string,
  page = 1,
  signal?: AbortSignal,
): Promise<SearchTmdbMoviesResponse> {
  const { data } = await apiClient.get<SearchTmdbMoviesResponse>(
    "/tmdb/movies/search",
    {
      params: { query, page },
      signal,
    },
  );
  return data;
}

export async function importMovieFromTmdb(
  tmdbMovieId: number,
): Promise<string> {
  const { data } = await apiClient.post<string>(
    `/movie-imports/tmdb/${tmdbMovieId}`,
  );

  return data;
}

export async function getMovie(
  movieId: string,
  signal?: AbortSignal,
): Promise<MovieResponse | null> {
  const response = await apiClient.get<MovieResponse>(`/movies/${movieId}`, {
    signal,
    validateStatus: (status) => status === 200 || status === 404,
  });

  return response.status === 404 ? null : response.data;
}

export async function getPopularMovies(
  page = 1,
  limit = 10,
  signal?: AbortSignal,
): Promise<MovieSearchResponse> {
  const { data } = await apiClient.get<MovieSearchResponse>("/movies/popular", {
    params: { page, limit },
    signal,
  });

  return data;
}

export async function getMovieRankings(
  page = 1,
  limit = 10,
  signal?: AbortSignal,
): Promise<MovieSearchResponse> {
  const { data } = await apiClient.get<MovieSearchResponse>(
    "/movies/rankings",
    {
      params: { page, limit },
      signal,
    },
  );

  return data;
}

export type UpdateMovieRecordInput = {
  isFavorite?: boolean;
  isWatched?: boolean;
  watchedAt?: string | null;
  rating?: string | null;
};

export async function getMovieRecord(
  movieId: string,
): Promise<UserMovieRecordResponse> {
  const { data } = await apiClient.get<UserMovieRecordResponse>(
    `/movies/${movieId}/record`,
  );

  return data;
}

export async function updateMovieRecord(
  movieId: string,
  input: UpdateMovieRecordInput,
): Promise<UserMovieRecordResponse> {
  const { data } = await apiClient.patch<UserMovieRecordResponse>(
    `/movies/${movieId}/record`,
    input,
  );

  return data;
}

export type UpcomingMoviesParams = {
  period?: "this-week";
  yearMonth?: string;
  page?: number;
  limit?: number;
};

export async function getUpcomingMovies(
  params: UpcomingMoviesParams = {},
  signal?: AbortSignal,
): Promise<MovieSearchResponse> {
  const { data } = await apiClient.get<MovieSearchResponse>(
    "/movies/upcoming",
    {
      params: {
        period: params.period,
        yearMonth: params.yearMonth,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      },
      signal,
    },
  );

  return data;
}
