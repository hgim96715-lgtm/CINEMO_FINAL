"use client";

import {useMemo, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {Eye, Star} from "lucide-react";
import {useQuery} from "@tanstack/react-query";

import {myMoviesQueryOptions} from "@/lib/queries/my-movies.query";
import {MovieSpaceDrawer, type MovieSpaceTab,} from "./MovieSpaceDrawer";

export function MyMoviesList() {
  const [activeTab, setActiveTab] = useState<MovieSpaceTab>("saved");
  const myMoviesQuery = useQuery(myMoviesQueryOptions());
  const movies = myMoviesQuery.data ?? [];

  const counts = useMemo(
    () => ({
      saved: movies.filter((movie) => movie.isFavorite).length,
      watched: movies.filter((movie) => movie.isWatched).length,
      postcards: 0,
    }),
    [movies],
  );

  const visibleMovies = useMemo(() => {
    if (activeTab === "saved") {
      return movies.filter((movie) => movie.isFavorite);
    }

    if (activeTab === "watched") {
      return movies.filter((movie) => movie.isWatched);
    }

    return [];
  }, [activeTab, movies]);

  if (myMoviesQuery.isPending) {
    return (
      <p className="text-sm text-cinemo-muted">내 영화를 불러오는 중...</p>
    );
  }

  return (
    <section className="space-y-5">
      <MovieSpaceDrawer
        activeTab={activeTab}
        onChange={setActiveTab}
        counts={counts}
      />

      {activeTab === "postcards" ? (
        <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
          <p className="text-sm text-cinemo-muted">
            작성한 엽서가 없습니다.
          </p>
        </div>
      ) : visibleMovies.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
          <p className="text-sm text-cinemo-muted">
            {activeTab === "saved"
              ? "찜한 영화가 없습니다."
              : "본 영화가 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleMovies.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.movieId}`}
              className="flex w-full max-w-sm min-w-0 gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-cinemo-gold/50 hover:bg-white/[0.06]"
            >
              <div className="relative aspect-2/3 w-24 shrink-0 sm:w-28">
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    alt={`${movie.title} 포스터`}
                    width={160}
                    height={240}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-white/5 text-center text-xs text-cinemo-muted">
                    포스터 없음
                  </div>
                )}
                
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center p-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-cinemo-text">
                  {movie.title}
                </h3>

                {(movie.watchedAt ?? movie.releaseDate) && (
                  <p className="mt-1 text-xs text-cinemo-muted">
                    {(movie.watchedAt ?? movie.releaseDate)?.slice(0, 10)}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs">
                  {movie.isWatched && (
                    <span className="inline-flex items-center gap-1 text-cinemo-muted">
                      <Eye className="size-3.5" />
                      관람
                    </span>
                  )}

                  {movie.rating && (
                    <span className="inline-flex items-center gap-1 text-cinemo-gold-light">
                      <Star className="size-3.5 fill-current" />
                      {movie.rating}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
