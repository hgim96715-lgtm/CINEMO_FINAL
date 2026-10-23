import { queryOptions } from "@tanstack/react-query";

import {
  getCurrentUser,
  getMyMovieNotifications,
  getMyMovies,
} from "@/lib/api/my-cinema";

export const myCinemaKeys = {
  all: ["my-cinema"] as const,
  user: () => [...myCinemaKeys.all, "user"] as const,
  movies: () => [...myCinemaKeys.all, "movies"] as const,
  notifications: () =>
    [...myCinemaKeys.all, "notifications"] as const,
};

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: myCinemaKeys.user(),
    queryFn: ({ signal }) => getCurrentUser(signal),
    staleTime: 5 * 60_000,
  });

export const myMoviesQueryOptions = (enabled = true) =>
  queryOptions({
    queryKey: myCinemaKeys.movies(),
    queryFn: ({ signal }) => getMyMovies(signal),
    enabled,
    staleTime: 5 * 60_000,
  });

export const myMovieNotificationsQueryOptions = (enabled = true) =>
  queryOptions({
    queryKey: myCinemaKeys.notifications(),
    queryFn: ({ signal }) => getMyMovieNotifications(signal),
    enabled,
    staleTime: 60_000,
  });
