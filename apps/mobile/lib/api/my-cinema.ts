import type { MobileLoginResponse } from "@/lib/api/auth";
import { apiClient } from "@/lib/api/apiClient";
import type { ViewingPlatform } from "./movie-records";

export type MyMovie = {
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
  viewingPlatform: ViewingPlatform | null;
  viewingPlatformCustom: string | null;
  venue: {
    id: string;
    type: string;
    name: string;
    brandName: string | null;
    roadAddress: string | null;
    jibunAddress: string | null;
  } | null;
};

export type MovieCalendarMovie = {
  movieId: string;
  title: string;
  posterUrl: string | null;
  genres: string[];
};

export type MovieCalendarDay = {
  date: string;
  movies: MovieCalendarMovie[];
};

export type MovieCalendarParams = {
  year: number;
  month: number;
};

export type MyMovieNotification = {
  id: string;
  movieId: string;
  release: {
    releaseDate: string | null;
  } | null;
  movie: {
    titles: Array<{ title: string }>;
    media: Array<{ url: string }>;
  };
};

export async function getCurrentUser(signal?: AbortSignal) {
  const response = await apiClient.get<MobileLoginResponse["user"]>(
    "/auth/me",
    { signal },
  );

  return response.data;
}

export async function getMyMovies(signal?: AbortSignal) {
  const response = await apiClient.get<MyMovie[]>("/movies/my", { signal });

  return response.data;
}

export async function getMovieCalendar(
  params: MovieCalendarParams,
  signal?: AbortSignal,
): Promise<MovieCalendarDay[]> {
  const response = await apiClient.get<MovieCalendarDay[]>("/movies/my/calendar", {
    params,
    signal,
  });

  return response.data;
}

export async function getMyMovieNotifications(signal?: AbortSignal) {
  const response = await apiClient.get<MyMovieNotification[]>(
    "/movies/notifications",
    { signal },
  );

  return response.data;
}
