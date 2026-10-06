"use client";

import { CalendarDays } from "lucide-react";

import { useMovieRecord } from "@/lib/queries/movie-record.query";
import { useAuthStore } from "@/stores/auth.store";

type MovieWatchedDateProps = {
  movieId: string;
};

export function MovieWatchedDate({ movieId }: MovieWatchedDateProps) {
  const user = useAuthStore((state) => state.user);
  const { data: record } = useMovieRecord(movieId, Boolean(user));

  if (!user || !record?.isWatched || !record.watchedAt) {
    return null;
  }

  return (
    <p className="mb-4 inline-flex items-center gap-2 rounded-lg border border-cinemo-gold/20 bg-cinemo-gold/8 px-3 py-2 text-sm text-cinemo-gold-light">
      <CalendarDays className="size-4" />
      관람일 {record.watchedAt.slice(0, 10).replaceAll("-", ".")}
    </p>
  );
}
