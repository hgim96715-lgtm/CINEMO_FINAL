"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { activeCurationsQueryOptions } from "@/lib/queries/curation.query";

export default function CommemorativeMoviesPage() {
  const curationsQuery = useQuery(activeCurationsQueryOptions());
  const curation = curationsQuery.data?.[0];
  const movies = (curation?.movies ?? []).filter(
    (movie) => Boolean(movie.title && movie.posterUrl),
  );

  return (
    <main className="mx-auto w-full max-w-[120rem] px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      <Link
        href="/lobby"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
      >
        <ChevronLeft className="size-4" />
        로비로 돌아가기
      </Link>

      <div className="mb-10">
        <p className="mb-2 text-xs tracking-[0.24em] text-primary">
          ANNIVERSARY
        </p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          기념일
        </h1>
        {curation?.title && (
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {curation.title}
          </p>
        )}
      </div>

      {curationsQuery.isPending ? (
        <p className="py-20 text-center text-muted-foreground">
          기념일 영화를 불러오는 중...
        </p>
      ) : curationsQuery.isError ? (
        <p className="py-20 text-center text-cinemo-red">
          기념일 영화를 불러오지 못했습니다.
        </p>
      ) : movies.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          등록된 기념일 영화가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
          {movies.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.id}`}
              className="group block"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-card">
                <Image
                  src={movie.posterUrl!}
                  alt={`${movie.title} 포스터`}
                  fill
                  sizes="(min-width: 1024px) 180px, (min-width: 640px) 22vw, 45vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h2 className="mt-3 truncate text-sm font-medium text-foreground">
                {movie.title}
              </h2>
              {movie.reason && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {movie.reason}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
