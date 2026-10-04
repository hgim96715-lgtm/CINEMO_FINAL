import type { MovieResponse, MovieSearchResponse } from "@cinemo/api-contract";
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
