"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  movieRankingQueryOptions,
  releasedMoviesQueryOptions,
} from "@/lib/queries/movie-search.query";
import {
  formatReleasedDate,
  getCurrentYearAndMonth,
  sortMoviesForToday,
} from "@/lib/released-movies";

export function ReleasedMovieCarousel() {
  const releasedQuery = useQuery(
    releasedMoviesQueryOptions({
      page: 1,
      limit: 100,
    }),
  );

  const rankingQuery = useQuery(
    movieRankingQueryOptions({
      page: 1,
      limit: 10,
    }),
  );

  const movies = useMemo(() => {
    const { year } = getCurrentYearAndMonth();

    const rankedMovieIds = new Set(
      rankingQuery.data?.items.map((movie) => movie.id) ?? [],
    );

    const candidates = (releasedQuery.data?.items ?? []).filter((movie) => {
      if (!movie.releaseDate) return false;

      return (
        movie.releaseDate.startsWith(`${year}-`) &&
        !rankedMovieIds.has(movie.id)
      );
    });

    return sortMoviesForToday(candidates).slice(0, 10);
  }, [releasedQuery.data, rankingQuery.data]);

  if (
    releasedQuery.isPending ||
    rankingQuery.isPending ||
    releasedQuery.isError ||
    rankingQuery.isError ||
    movies.length === 0
  ) {
    return null;
  }

  return (
    <section aria-labelledby="released-movies-title" className="mt-12 sm:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs tracking-[0.24em] text-primary">
            THIS YEAR
          </p>

          <h2
            id="released-movies-title"
            className="text-2xl font-semibold text-foreground sm:text-3xl"
          >
            올해 개봉한 영화
          </h2>
        </div>

        <Link
          href="/lobby/movies/released"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition hover:text-primary"
        >
          더보기
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <ol className=" flex gap-4 overflow-x-auto pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {movies.map((movie) => (
          <li
            key={movie.id}
            className="w-30 shrink-0 sm:w-36 max-sm:w-[42vw] max-sm:snap-center"
          >
            <Link href={`/movies/${movie.id}`} className="group block">
              <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-card">
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
              </div>

              <h3 className="mt-3 truncate text-sm font-medium text-foreground">
                {movie.title}
              </h3>

              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {formatReleasedDate(movie.releaseDate)}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
