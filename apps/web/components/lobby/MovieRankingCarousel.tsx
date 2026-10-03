"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { movieRankingQueryOptions } from "@/lib/queries/movie-search.query";

export function MovieRankingCarousel() {
  const rankingQuery = useQuery(
    movieRankingQueryOptions({
      page: 1,
    }),
  );

  const scrollRef = useRef<HTMLOListElement>(null);
  const movies = rankingQuery.data?.items ?? [];

  const move = (direction: "left" | "right") => {
    const list = scrollRef.current;

    if (!list) return;

    const distance = Math.max(list.clientWidth * 0.8, 240);
    const nextLeft =
      list.scrollLeft + (direction === "left" ? -distance : distance);

    list.scrollTo({
      left: Math.max(
        0,
        Math.min(nextLeft, list.scrollWidth - list.clientWidth),
      ),
      behavior: "smooth",
    });
  };

  if (rankingQuery.isPending || rankingQuery.isError || movies.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="movie-ranking-title" className="mt-12 sm:mt-16 ">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs tracking-[0.24em] text-primary">
            CINEMO RANKING
          </p>

          <h2
            id="movie-ranking-title"
            className="text-2xl font-semibold text-foreground sm:text-3xl"
          >
            오늘의 영화 순위
          </h2>
        </div>

        <span className="text-xs text-muted-foreground sm:text-sm">
          KOBIS 박스오피스
        </span>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="이전 순위 영화 보기"
            onClick={() => move("left")}
            className="pointer-events-auto h-20 w-14 rounded-xl bg-gradient-to-r from-cinemo-bg/75 via-cinemo-bg/35 to-transparent text-cinemo-gold drop-shadow-lg backdrop-blur-[2px] transition-colors hover:bg-cinemo-teal/45 hover:text-cinemo-gold-light active:bg-cinemo-teal/60 max-sm:h-16 max-sm:w-12 [&_svg]:size-6"
          >
            <ChevronLeft />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="다음 순위 영화 보기"
            onClick={() => move("right")}
            className="pointer-events-auto h-20 w-14 rounded-xl bg-gradient-to-l from-cinemo-bg/75 via-cinemo-bg/35 to-transparent text-cinemo-gold drop-shadow-lg backdrop-blur-[2px] transition-colors hover:bg-cinemo-teal/45 hover:text-cinemo-gold-light active:bg-cinemo-teal/60 max-sm:h-16 max-sm:w-12 [&_svg]:size-6"
          >
            <ChevronRight />
          </Button>
        </div>

        <ol
          ref={scrollRef}
          className="flex snap-x gap-4 overflow-x-auto pl-10 pr-0 pb-4 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {movies.map((movie, index) => (
            <li key={movie.id} className="w-34 shrink-0 snap-start sm:w-42">
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
                      포스터 없음
                    </div>
                  )}

                  <span className="absolute bottom-2 left-2 text-3xl font-black leading-none text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                    {movie.rank ?? index + 1}
                  </span>
                </div>

                <h3 className="mt-3 truncate text-sm font-medium text-foreground">
                  {movie.title}
                </h3>

                {movie.releaseDate ? (
                  <time
                    dateTime={movie.releaseDate}
                    className="mt-1 block text-xs text-muted-foreground"
                  >
                    {movie.releaseDate.slice(0, 4)}
                  </time>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
