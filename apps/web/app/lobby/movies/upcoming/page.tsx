"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { UpcomingMovieActions } from "@/components/lobby/UpcomingMovieActions";
import { upcomingMoviesQueryOptions } from "@/lib/queries/movie-search.query";

type FilterValue = "all" | "this-week" | string;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CINEMO_TIME_ZONE = "Asia/Seoul";

const getMonthOptions = () => {
  const currentMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());

  const [year, month] = currentMonth.split("-").map(Number);

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 + index, 1));

    return {
      value: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "long",
      }).format(date),
    };
  });
};

const formatReleaseDate = (releaseDate: string | null) => {
  if (!releaseDate) return "개봉일 미정";

  const todayString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(new Date());

  const today = new Date(`${todayString}T00:00:00Z`);
  const targetDate = new Date(`${releaseDate}T00:00:00Z`);
  const days = Math.round(
    (targetDate.getTime() - today.getTime()) / DAY_IN_MS,
  );

  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    timeZone: CINEMO_TIME_ZONE,
    month: "long",
    day: "numeric",
  }).format(targetDate);

  return `D-${days} · ${dateLabel}`;
};

export default function UpcomingMoviesPage() {
  const [filter, setFilter] = useState<FilterValue>("all");

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const upcomingQuery = useQuery(
    upcomingMoviesQueryOptions({
      period: filter === "this-week" ? "this-week" : undefined,
      yearMonth:
        filter !== "all" && filter !== "this-week" ? filter : undefined,
      page: 1,
      limit: 100,
    }),
  );
  const movies = [...(upcomingQuery.data?.items ?? [])].sort((a, b) =>
    (a.releaseDate ?? "9999-12-31").localeCompare(
      b.releaseDate ?? "9999-12-31",
    ),
  );
  return (
    <main className="mx-auto w-full max-w-[120rem] px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      <Link
        href="/lobby"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        로비로 돌아가기
      </Link>

      <div className="mb-8">
        <p className="mb-2 text-xs tracking-[0.24em] text-primary">
          COMING SOON
        </p>

        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          개봉 예정작
        </h1>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`shrink-0 rounded-xl border px-4 py-2 text-sm transition ${
            filter === "all"
              ? "border-cinemo-gold/60 bg-cinemo-gold/15 text-cinemo-gold-light"
              : "border-white/20 bg-white/5 text-cinemo-muted hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light"
          }`}
        >
          전체
        </button>

        <button
          type="button"
          onClick={() => setFilter("this-week")}
          className={`shrink-0 rounded-xl border px-4 py-2 text-sm transition ${
            filter === "this-week"
              ? "border-cinemo-gold/60 bg-cinemo-gold/15 text-cinemo-gold-light"
              : "border-white/20 bg-white/5 text-cinemo-muted hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light"
          }`}
        >
          이번 주
        </button>

        {monthOptions.slice(0, 3).map((month) => (
          <button
            key={month.value}
            type="button"
            onClick={() => setFilter(month.value)}
            className={`shrink-0 rounded-xl border px-4 py-2 text-sm transition ${
              filter === month.value
                ? "border-cinemo-gold/60 bg-cinemo-gold/15 text-cinemo-gold-light"
                : "border-white/20 bg-white/5 text-cinemo-muted hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light"
            }`}
          >
            {month.label}
          </button>
        ))}
      </div>

      {upcomingQuery.isPending ? (
        <p className="py-20 text-center text-muted-foreground">
          개봉 예정작을 불러오는 중...
        </p>
      ) : upcomingQuery.isError ? (
        <p className="py-20 text-center text-cinemo-red">
          개봉 예정작을 불러오지 못했습니다.
        </p>
      ) : movies.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          해당 조건의 개봉 예정작이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
          {movies.map((movie) => (
            <article key={movie.id} className="group block">
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
                      sizes="(min-width: 1024px) 180px, (min-width: 640px) 22vw, 45vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      포스터 준비중
                    </div>
                  )}
                </Link>

                <UpcomingMovieActions movieId={movie.id} />
              </div>

              <Link href={`/movies/${movie.id}`} className="block">
                <h2 className="mt-3 truncate text-sm font-medium text-foreground">
                  {movie.title}
                </h2>

                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {formatReleaseDate(movie.releaseDate)}
                </p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
