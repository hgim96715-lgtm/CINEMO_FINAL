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

  const totalCount = releasedQuery.data?.totalCount ?? 0;

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

        {!releasedQuery.isPending && !releasedQuery.isError && (
          <p className="mt-3 text-sm text-muted-foreground">
            전체 {totalCount}편 중 {movies.length}편 표시 중
          </p>
        )}
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
            filter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
          }`}
        >
          전체
        </button>

        {monthOptions.map((month) => (
          <button
            key={month.value}
            type="button"
            onClick={() => setFilter(month.value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
              filter === month.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
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
