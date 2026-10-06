"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { upcomingMoviesQueryOptions } from "@/lib/queries/movie-search.query";

type FilterValue = "all" | "this-week" | string;

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

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${releaseDate}T00:00:00+09:00`));
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
    (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"),
  );
  const totalCount = upcomingQuery.data?.totalCount ?? 0;

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

        {!upcomingQuery.isPending && !upcomingQuery.isError && (
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

        <button
          type="button"
          onClick={() => setFilter("this-week")}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
            filter === "this-week"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
          }`}
        >
          이번 주
        </button>

        {monthOptions.slice(0, 3).map((month) => (
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
                    sizes="(min-width: 1024px) 180px, (min-width: 640px)  twenty-twovw, 45vw"
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
                {formatReleaseDate(movie.releaseDate)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
