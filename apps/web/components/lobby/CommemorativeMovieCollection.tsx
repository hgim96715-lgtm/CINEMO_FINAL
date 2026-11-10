"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { activeCurationsQueryOptions } from "@/lib/queries/curation.query";

export function CommemorativeMovieCollection() {
  const curationsQuery = useQuery(activeCurationsQueryOptions());
  const movies = Array.from(
    new Map(
      (curationsQuery.data ?? [])
        .flatMap((curation) => curation.movies)
        .filter((movie) => Boolean(movie.title && movie.posterUrl))
        .map((movie) => [movie.id, movie]),
    ).values(),
  );

  if (curationsQuery.isPending || curationsQuery.isError || movies.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="commemorative-movies-title" className="mt-12 sm:mt-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs tracking-[0.24em] text-primary">
            ANNIVERSARY
          </p>
          <h2
            id="commemorative-movies-title"
            className="text-2xl font-semibold text-foreground sm:text-3xl"
          >
            기념일
          </h2>
        </div>

        <Link
          href="/lobby/movies/commemorative"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition hover:text-primary"
        >
          더보기
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <ol className="flex gap-4 overflow-x-auto pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {movies.map((movie) => (
          <li
            key={movie.id}
            className="w-30 shrink-0 sm:w-36 max-sm:w-[42vw] max-sm:snap-center"
          >
            <Link href={`/movies/${movie.id}`} className="group block">
              <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-card">
                <Image
                  src={movie.posterUrl!}
                  alt={`${movie.title} 포스터`}
                  fill
                  sizes="(min-width: 640px) 168px, 42vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 truncate text-sm font-medium text-foreground">
                {movie.title}
              </h3>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
