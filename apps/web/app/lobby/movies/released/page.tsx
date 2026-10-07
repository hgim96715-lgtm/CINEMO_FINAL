"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { releasedMoviesQueryOptions } from "@/lib/queries/movie-search.query";
import {
  formatReleasedDate,
  getCurrentYearAndMonth,
  sortMoviesForToday,
} from "@/lib/released-movies";

type FilterValue = "all" | string;

const getMonthOptions = () => {
  const { year, month } = getCurrentYearAndMonth();

  return Array.from({ length: month }, (_, index) => {
    const monthNumber = index + 1;
    const value = `${year}-${String(monthNumber).padStart(2, "0")}`;

    return {
      value,
      label: `${year}년 ${monthNumber}월`,
    };
  });
};

export default function ReleasedMoviesPage() {
  const [filter, setFilter] = useState<FilterValue>("all");

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const releasedQuery = useQuery(
    releasedMoviesQueryOptions({
      yearMonth: filter === "all" ? undefined : filter,
      page: 1,
      limit: 100,
    }),
  );

  const movies = sortMoviesForToday(
    (releasedQuery.data?.items ?? []).filter((movie) => {
      if (filter !== "all") {
        return true;
      }

      return Boolean(movie.releaseDate);
    }),
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
        <p className="mb-2 text-xs tracking-[0.24em] text-primary">THIS YEAR</p>

        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          올해 개봉한 영화
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

        {monthOptions.map((month) => (
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

      {releasedQuery.isPending ? (
        <p className="py-20 text-center text-muted-foreground">
          개봉한 영화를 불러오는 중...
        </p>
      ) : releasedQuery.isError ? (
        <p className="py-20 text-center text-cinemo-red">
          개봉한 영화를 불러오지 못했습니다.
        </p>
      ) : movies.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          해당 조건의 영화가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
          {movies.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.id}`}
              className="group block"
            >
              <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-card">
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

                {movie.isAdultOnly && (
                  <span
                    aria-label="청소년관람불가"
                    title="청소년관람불가"
                    className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md border-2 border-red-300/70 bg-red-500/55 text-base font-black leading-none text-red-50 shadow-[0_0_10px_rgba(239,68,68,0.14)] backdrop-blur-sm"
                  >
                    <span className="relative top-px">19</span>
                  </span>
                )}
              </div>

              <h2 className="mt-3 truncate text-sm font-medium text-foreground">
                {movie.title}
              </h2>

              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {formatReleasedDate(movie.releaseDate)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
