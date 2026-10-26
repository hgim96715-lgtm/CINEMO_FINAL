import type {
  MovieResponse,
  MovieSearchResponse,
  SearchTmdbMoviesResponse,
} from "@cinemo/api-contract";
import { apiClient } from "./apiClient";

export async function getMovie(
  movieId: string,
  signal?: AbortSignal,
): Promise<MovieResponse> {
  const { data } = await apiClient.get<MovieResponse>(`/movies/${movieId}`, {
    signal,
  });

  return data;
}

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

export async function getTmdbMovieDetail(
  tmdbMovieId: number,
  signal?: AbortSignal,
): Promise<{ poster_path: string | null }> {
  const { data } = await apiClient.get<{ poster_path: string | null }>(
    `/tmdb/movies/${tmdbMovieId}`,
    { signal },
  );

  return data;
}

export async function importMovieFromTmdb(
  tmdbMovieId: number,
): Promise<string> {
  const { data } = await apiClient.post<string>(
    `/movie-imports/tmdb/${tmdbMovieId}`,
    undefined,
    { timeout: 60_000 },
  );

  return data;
}

export async function enrichMovieFromTmdb(
  movieId: string,
  tmdbMovieId: number,
): Promise<string> {
  const { data } = await apiClient.post<string>(
    `/movie-imports/${movieId}/enrich/tmdb/${tmdbMovieId}`,
    undefined,
    { timeout: 60_000 },
  );

  return data;
}

export async function enrichMovieFromKmdb(movieId: string): Promise<string> {
  const { data } = await apiClient.post<string>(
    `/movie-imports/${movieId}/enrich/kmdb`,
    undefined,
    { timeout: 60_000 },
  );

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
      params: {
        page,
        limit,
      },
      signal,
    },
  );

  return data;
}

export async function getPopularMovies(
  page = 1,
  limit = 20,
  signal?: AbortSignal,
): Promise<MovieSearchResponse> {
  const { data } = await apiClient.get<MovieSearchResponse>("/movies/popular", {
    params: {
      page,
      limit,
    },
    signal,
  });

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

export type ReleasedMoviesParams = {
  yearMonth?: string;
  page?: number;
  limit?: number;
};

export async function getReleasedMovies(
  params: ReleasedMoviesParams = {},
  signal?: AbortSignal,
): Promise<MovieSearchResponse> {
  const { data } = await apiClient.get<MovieSearchResponse>(
    "/movies/released",
    {
      params: {
        yearMonth: params.yearMonth,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      },
      signal,
    },
  );
  return data;
}
