"use client";

import { useQuery } from "@tanstack/react-query";

import { myMovieNotificationsQueryOptions } from "@/lib/queries/movie-notification.query";
import { myMoviesQueryOptions } from "@/lib/queries/my-movies.query";

export function MyCinemaStats() {
  const moviesQuery = useQuery(myMoviesQueryOptions());
  const notificationsQuery = useQuery(myMovieNotificationsQueryOptions());

  const movies = moviesQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const isLoading = moviesQuery.isPending || notificationsQuery.isPending;

  const stats = [
    {
      label: "저장한 영화",
      value: movies.filter((movie) => movie.isFavorite).length,
    },
    {
      label: "관람 기록",
      value: movies.filter((movie) => movie.isWatched).length,
    },
    {
      label: "개봉 알림",
      value: notifications.length,
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-white/10 bg-white/3 px-2 py-4 text-center"
        >
          <p className="text-xl font-bold text-cinemo-gold-light">
            {isLoading ? "—" : stat.value}
          </p>
          <p className="mt-1 text-[11px] text-cinemo-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
