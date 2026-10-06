"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, CalendarDays, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { upcomingMoviesQueryOptions } from "@/lib/queries/movie-search.query";

const CINEMO_TIME_ZONE = "Asia/Seoul";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const formatReleaseDate = (releaseDate: string | null) => {
  if (!releaseDate) return "개봉일 미정";

  const todayString = new Intl.DateTimeFormat("en-CA", {
    timeZone: CINEMO_TIME_ZONE,
  }).format(new Date());

  const today = new Date(`${todayString}T00:00:00Z`);
  const targetDate = new Date(`${releaseDate}T00:00:00Z`);
  const days = Math.round((targetDate.getTime() - today.getTime()) / DAY_IN_MS);

  if (days === 0) return "오늘 개봉";

  const releaseYear = targetDate.getUTCFullYear();
  const currentYear = today.getUTCFullYear();

  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    timeZone: CINEMO_TIME_ZONE,
    ...(releaseYear !== currentYear && { year: "numeric" }),
    month: "long",
    day: "numeric",
  }).format(targetDate);

  return `D-${days} · ${dateLabel}`;
};

export function UpcomingMovieCarousel() {
  const upcomingQuery = useQuery(
    upcomingMoviesQueryOptions({
      page: 1,
      limit: 10,
    }),
  );

  const movies = [...(upcomingQuery.data?.items ?? [])].sort((a, b) =>
    (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"),
  );

  if (upcomingQuery.isPending || upcomingQuery.isError || movies.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="upcoming-movies-title" className="mt-12 sm:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs tracking-[0.24em] text-primary">
            COMING SOON
          </p>

          <h2
            id="upcoming-movies-title"
            className="text-2xl font-semibold text-foreground sm:text-3xl"
          >
            개봉 예정작
          </h2>
        </div>

        <Link
          href="/lobby/movies/upcoming"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition hover:text-primary"
        >
          더보기
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <ol className="flex gap-4 overflow-x-auto pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {movies.map((movie) => (
          <li
            key={movie.id}
            className="w-30 shrink-0 sm:w-36 max-sm:w-[42vw] max-sm:snap-center"
          >
            <div className="group block">
              <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-card">
                <Link
                  href={`/movies/${movie.id}`}
                  aria-label={`${movie.title} 상세 보기`}
                >
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={`${movie.title} 포스터`}
                      fill
                      sizes="(min-width: 640px) 168px, 136px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      포스터 준비중
                    </div>
                  )}
                </Link>

                <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                  <button
                    type="button"
                    aria-label="찜하기"
                    className="inline-flex size-8 items-center justify-center rounded-full border border-white/20 bg-cinemo-bg/70 text-white/80 backdrop-blur-md transition hover:border-cinemo-gold/60 hover:text-cinemo-gold-light"
                  >
                    <Heart className="size-4" />
                  </button>

                  <button
                    type="button"
                    aria-label="개봉 알림 신청"
                    className="inline-flex size-8 items-center justify-center rounded-full border border-white/20 bg-cinemo-bg/70 text-white/80 backdrop-blur-md transition hover:border-cinemo-gold/60 hover:text-cinemo-gold-light"
                  >
                    <Bell className="size-4" />
                  </button>
                </div>
              </div>

              <Link href={`/movies/${movie.id}`} className="block">
                <h3 className="mt-3 truncate text-sm font-medium text-foreground">
                  {movie.title}
                </h3>
              </Link>

              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {formatReleaseDate(movie.releaseDate)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
