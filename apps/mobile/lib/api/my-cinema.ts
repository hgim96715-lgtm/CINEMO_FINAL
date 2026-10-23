import type { MobileLoginResponse } from "@/lib/api/auth";
import { apiClient } from "@/lib/api/apiClient";

export type MyMovie = {
  movieId: string;
  title: string;
  posterUrl: string | null;
  isFavorite: boolean;
  isWatched: boolean;
  watchedAt: string | null;
  rating: string | null;
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

export async function getMyMovieNotifications(signal?: AbortSignal) {
  const response = await apiClient.get<MyMovieNotification[]>(
    "/movies/notifications",
    { signal },
  );

  return response.data;
}
