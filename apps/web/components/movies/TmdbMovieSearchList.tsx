"use client";

import type { SearchTmdbMoviesResponse } from "@cinemo/api-contract";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { importMovieFromTmdb } from "@/lib/api/movies";

type TmdbMovie = SearchTmdbMoviesResponse["results"][number];

type TmdbMovieSearchListProps = {
  movies: TmdbMovie[];
};

export function TmdbMovieSearchList({ movies }: TmdbMovieSearchListProps) {
  const router = useRouter();
  const [loadingMovieId, setLoadingMovieId] = useState<number | null>(null);

  const handleSelect = async (tmdbMovieId: number) => {
    setLoadingMovieId(tmdbMovieId);

    try {
      const movieId = await importMovieFromTmdb(tmdbMovieId);
      router.push(`/movies/${movieId}?sync=1`);
    } finally {
      setLoadingMovieId(null);
    }
  };

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4 sm:gap-6">
      {movies.map((movie) => {
        const posterUrl = movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null;
        const isLoading = loadingMovieId === movie.id;

        return (
          <li key={movie.id} className="min-w-0 max-w-[18rem]">
            <button
              type="button"
              onClick={() => handleSelect(movie.id)}
              disabled={loadingMovieId !== null}
              className="group block w-full text-left disabled:cursor-wait"
            >
              <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-white/10 bg-cinemo-surface">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={`${movie.title} 포스터`}
                    fill
                    sizes="(min-width: 1024px) 224px, (min-width: 640px) 30vw, 45vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-cinemo-muted">
                    포스터 준비중
                  </div>
                )}

                {movie.adult && (
                  <span
                    aria-label="청소년관람불가"
                    className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md border-2 border-red-300/70 bg-red-500/55 text-base font-black leading-none text-red-50 shadow-[0_0_10px_rgba(239,68,68,0.14)] backdrop-blur-sm"
                  >
                    <span className="relative top-px">19</span>
                  </span>
                )}

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-cinemo-bg/65 text-sm text-cinemo-text backdrop-blur-sm">
                    불러오는 중...
                  </div>
                )}
              </div>

              <h2 className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-cinemo-text transition group-hover:text-cinemo-gold-light sm:text-base">
                {movie.title}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-cinemo-muted">
                {movie.release_date && (
                  <time dateTime={movie.release_date}>
                    {movie.release_date.replaceAll("-", ".")}
                  </time>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
