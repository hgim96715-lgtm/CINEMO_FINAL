import type {
  MovieResponse,
  MovieSearchResponse,
  SearchTmdbMoviesResponse,
  UserMovieRecordResponse,
} from "@cinemo/api-contract";
import {apiClient} from "./apiClient";

export type ViewingPlatform =
    | "NETFLIX"
    | "WATCHA"
    | "TVING"
    | "DISNEY_PLUS"
    | "WAVVE"
    | "APPLE_TV"
    | "PRIME_VIDEO"
    | "COUPANG_PLAY"
    | "TV"
    | "OTHER";


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
  venueId?: string | null;
  viewingPlaceType?: "HOME" | "VENUE" | null;
  viewingPlatform?:ViewingPlatform |null;
  viewingPlatformCustom?: string | null;
};
export async function getMovieRecord(
  movieId: string,
  signal?: AbortSignal,
): Promise<UserMovieRecordResponse> {
  const { data } = await apiClient.get<UserMovieRecordResponse>(
    `/movies/${movieId}/record`,
    { signal },
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

export type MovieNotificationStatus = {
  movieId: string;
  enabled: boolean;
  releaseDate: string | null;
};

export async function getMovieNotification(
  movieId: string,
  signal?: AbortSignal,
): Promise<MovieNotificationStatus> {
  const { data } = await apiClient.get<MovieNotificationStatus>(
    `/movies/${movieId}/notification`,
    { signal },
  );

  return data;
}

export async function subscribeMovieNotification(
  movieId: string,
): Promise<void> {
  await apiClient.post(`/movies/${movieId}/notification`);
}

export async function unsubscribeMovieNotification(
  movieId: string,
): Promise<void> {
  await apiClient.delete(`/movies/${movieId}/notification`);
}

export type MyMovieVenue = {
  id: string;
  type: "CINEMA" | "HOME" | "MUSEUM" | "EXHIBITION_HALL" | "PERFORMANCE_HALL" | "OTHER";
  name: string;
  brandName: string | null;
  roadAddress: string | null;
  jibunAddress: string | null;
};


export type MyMovie = {
  id: string;
  movieId: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  isFavorite: boolean;
  isWatched: boolean;
  watchedAt: string | null;
  rating: string | null;
  venueId: string | null;
  viewingPlaceType: "HOME" | "VENUE" | null;
  viewingPlatform:ViewingPlatform | null;
  viewingPlatformCustom: string | null;
  venue: MyMovieVenue | null;
};

export async function getMyMovies(
  signal?: AbortSignal,
): Promise<MyMovie[]> {
  const { data } = await apiClient.get<MyMovie[]>("/movies/my", {
    signal,
  });

  return data;
}

export async function deleteMovieRecord(movieId: string): Promise<void> {
  await apiClient.delete(`/movies/${movieId}/record`);
}

export type MovieCalendarParams={
  year:number;
  month:number;
}

export type MovieCalendarMovie={
  movieId: string;
  title: string;
  posterUrl: string | null;
  genres:string[];
}

export type MovieCalendarDay={
  date:string;
  movies:MovieCalendarMovie[];
}

export async function  getMovieCalendar(params:MovieCalendarParams,signal?: AbortSignal): Promise<MovieCalendarDay[]> {
  const {data}=await apiClient.get<MovieCalendarDay[]>('/movies/my/calendar', {
    params: {
      year: params.year,
      month: params.month,
    },
    signal,
  })
  return data;
}
