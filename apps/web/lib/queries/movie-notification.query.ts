import {queryOptions} from "@tanstack/react-query";

import {getMovieNotification, getMovieNotifications} from "@/lib/api/movies";

export const movieNotificationQueryOptions = (
  movieId: string,
) =>
  queryOptions({
    queryKey: ["movies", "notification", movieId],
    queryFn: ({ signal }) => getMovieNotification(movieId, signal),
    enabled: movieId.length > 0,
    staleTime: 5 * 60_000,
  });

export const myMovieNotificationsQueryOptions = ()=>
    queryOptions({
      queryKey:["my-cinema","notification"],
      queryFn:({ signal }) => getMovieNotifications(signal),
      staleTime: 5 * 60_000,
    })