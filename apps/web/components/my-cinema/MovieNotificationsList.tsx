"use client";

import Image from "next/image";
import Link from "next/link";
import {useQuery} from "@tanstack/react-query";
import {BellOff} from "lucide-react";

import type {MovieNotificationItem} from "@/lib/api/movies";
import {useUnsubscribeMovieNotification} from "@/lib/queries/movie-notification.mutation";
import {myMovieNotificationsQueryOptions} from "@/lib/queries/movie-notification.query";

const formatReleaseDate = (date: string | null) => {
  if (!date) {
    return "개봉일 미정";
  }
  
  const parsedDate =
      date.length === 10
          ? new Date(`${date}T00:00:00+09:00`)
          : new Date(date);
  
  if (Number.isNaN(parsedDate.getTime())) {
    return "개봉일 미정";
  }
  
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsedDate);
};

function MovieNotificationCard({notification}: { notification: MovieNotificationItem}) {
  const title = notification.movie.titles[0]?.title ?? "제목 없음";
  const posterUrl = notification.movie.media[0]?.url ?? null;
  
  const unsubscribeMutation = useUnsubscribeMovieNotification(
      notification.movieId,
  );
  
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-white/10 bg-white/3 p-3 sm:flex-row sm:items-center">
        <Link
            href={`/movies/${notification.movieId}`}
            className="flex min-w-0 flex-1 gap-4"
        >
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
            {posterUrl ? (
                <Image
                    src={posterUrl}
                    alt={`${title} 포스터`}
                    fill
                    sizes="64px"
                    className="object-cover"
                />
            ) : (
                <span className="flex h-full items-center justify-center text-center text-[10px] text-cinemo-muted">
              포스터 없음
            </span>
            )}
          </div>
          
          <div className="min-w-0 py-1">
          <h3 className="line-clamp-2 break-words font-semibold text-cinemo-text">
              {title}
            </h3>
            
            <p className="mt-2 text-xs text-cinemo-gold">
              {formatReleaseDate(notification.release?.releaseDate ?? null)}
            </p>
            
            <p className="mt-1 text-xs text-cinemo-muted">
              개봉 알림 신청 중
            </p>
          </div>
        </Link>
        
        <button
            type="button"
            disabled={unsubscribeMutation.isPending}
            onClick={() => {
              unsubscribeMutation.mutate();
            }}
        className="inline-flex shrink-0 items-center gap-1.5 self-end rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium whitespace-nowrap text-cinemo-muted transition hover:border-red-300/40 hover:bg-red-300/10 hover:text-red-300 disabled:opacity-50 sm:self-center"
        >
          <BellOff className="size-3.5" />
          {unsubscribeMutation.isPending ? "해제 중..." : "알림 해제"}
        </button>
      </div>
  );
}

export function MovieNotificationsList() {
  const notificationsQuery = useQuery(
      myMovieNotificationsQueryOptions(),
  );
  
  if (notificationsQuery.isPending) {
    return (
        <p className="text-sm text-cinemo-muted">
          개봉 알림을 불러오는 중...
        </p>
    );
  }
  
  if (notificationsQuery.isError) {
    return (
        <p className="text-sm text-red-300">
          개봉 알림을 불러오지 못했습니다.
        </p>
    );
  }
  
  const notifications = notificationsQuery.data ?? [];
  
  if (notifications.length === 0) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
          <p className="text-sm text-cinemo-muted">
            신청한 개봉 알림이 없습니다.
          </p>
        </div>
    );
  }
  
  return (
      <div className="grid gap-3 sm:grid-cols-2">
        {notifications.map((notification) => (
            <MovieNotificationCard
                key={notification.id}
                notification={notification}
            />
        ))}
      </div>
  );
}
