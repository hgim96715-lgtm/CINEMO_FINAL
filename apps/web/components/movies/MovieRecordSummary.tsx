"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Star } from "lucide-react";

import { movieRecordQueryOptions } from "@/lib/queries/movie-record.query";
import { useAuthStore } from "@/stores/auth.store";

type MovieRecordSummaryProps = {
  movieId: string;
  onEditWatchedDate: () => void;
};

export function MovieRecordSummary({
  movieId,
  onEditWatchedDate,
}: MovieRecordSummaryProps) {
  const user = useAuthStore((state) => state.user);
  const { data: record } = useQuery({
    ...movieRecordQueryOptions(movieId),
    enabled: Boolean(user),
  });

  const hasWatchedDate = Boolean(record?.isWatched && record.watchedAt);

  if (!user) {
    return null;
  }

  const ratingLabel = record?.rating
    ? `${Number(record.rating).toFixed(1)}점`
    : "-";
  const watchedDateLabel =
    record?.isWatched && record.watchedAt
      ? record.watchedAt.slice(0, 10).replaceAll("-", ".")
      : "없음";

  return (
    <div className="mt-3 w-fit min-w-60 rounded-xl border border-cinemo-gold/20 bg-cinemo-bg/55 p-3">
      <div className="flex items-center justify-between gap-8 text-sm">
        <span className="inline-flex items-center gap-1.5 text-cinemo-muted">
          <Star className="size-4 text-cinemo-gold" />
          나의 평점
        </span>
        <span
          className={
            record?.rating
              ? "font-medium text-cinemo-gold-light"
              : "text-cinemo-muted"
          }
        >
          {ratingLabel}
        </span>
      </div>

      <div className="my-2 border-t border-white/10" />

      <div className="flex items-center justify-between gap-8 text-sm">
        <span className="inline-flex items-center gap-1.5 text-cinemo-muted">
          <CalendarDays className="size-4 text-cinemo-gold" />
          관람일
        </span>
        {hasWatchedDate ? (
          <button
            type="button"
            onClick={onEditWatchedDate}
            className="font-medium text-cinemo-gold-light"
            title="관람일 수정"
          >
            {watchedDateLabel}
          </button>
        ) : (
          <span className="text-cinemo-muted">{watchedDateLabel}</span>
        )}
      </div>
    </div>
  );
}
