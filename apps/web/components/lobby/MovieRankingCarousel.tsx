"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { movieRankingQueryOptions } from "@/lib/queries/movie-search.query";

export function MovieRankingCarousel() {
  const rankingQuery = useQuery(
    movieRankingQueryOptions({
      page: 1,
    }),
  );

  const formatAudienceCount = (count: number | null) => {
    if (count === null) return "-";

    const flooredCount = Math.floor(count / 1_000) * 1_000;

    const formatted = new Intl.NumberFormat("ko-KR", {
      notation: "compact",
      maximumFractionDigits: 1,
      useGrouping: true,
    }).format(flooredCount);

    return `누적 ${formatted}`;
  };

  function RankChange({ value }: { value: number | null }) {
    if (value === null || value === 0) return null;

    if (value > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-cinemo-gold">
          <TrendingUp className="size-4" />+{value}
        </span>
      );
    }

    if (value < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-cinemo-teal-light">
          <TrendingDown className="size-4" />
          {value}
        </span>
      );
    }

    return null;
  }

  const scrollRef = useRef<HTMLOListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const movies = rankingQuery.data?.items ?? [];

  const updateScrollButtons = useCallback(() => {
    const list = scrollRef.current;
    if (!list) return;

    const maxScrollLeft = Math.max(0, list.scrollWidth - list.clientWidth);
    const leftPadding = Number.parseFloat(
      window.getComputedStyle(list).paddingLeft,
    );

    setCanScrollLeft(
      list.scrollLeft > (Number.isNaN(leftPadding) ? 0 : leftPadding) + 1,
    );
    setCanScrollRight(list.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const list = scrollRef.current;
    if (!list) return;

    list.scrollLeft = 0;
    updateScrollButtons();
    list.addEventListener("scroll", updateScrollButtons, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(list);
    Array.from(list.children).forEach((child) => resizeObserver.observe(child));

    return () => {
      list.removeEventListener("scroll", updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [movies.length, updateScrollButtons]);

  const move = (direction: "left" | "right") => {
    const list = scrollRef.current;

    if (!list) return;

    const distance = Math.max(list.clientWidth * 0.8, 240);
    const nextLeft =
      list.scrollLeft + (direction === "left" ? -distance : distance);

    const targetLeft = Math.max(
      0,
      Math.min(nextLeft, list.scrollWidth - list.clientWidth),
    );

    list.scrollLeft = targetLeft;
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
        <>
          {canScrollLeft && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="이전 순위 영화 보기"
              onClick={() => move("left")}
              className="pointer-events-auto absolute left-2 top-1/2 z-20 h-20 w-14 -translate-y-1/2 rounded-xl bg-linear-to-r from-cinemo-bg/75 via-cinemo-bg/35 to-transparent text-cinemo-gold drop-shadow-lg backdrop-blur-[2px] transition-colors hover:bg-cinemo-teal/45 hover:text-cinemo-gold-light active:bg-cinemo-teal/60 max-sm:hidden max-sm:h-14 max-sm:w-14 max-sm:rounded-lg max-sm:border max-sm:border-cinemo-teal-light/15 max-sm:bg-cinemo-teal/25 max-sm:bg-none max-sm:text-cinemo-gold-light/85 max-sm:backdrop-blur-md max-sm:hover:bg-cinemo-teal/35 max-sm:active:bg-cinemo-teal/70 xl:hidden [&_svg]:size-6"
            >
              <ChevronLeft />
            </Button>
          )}

          {canScrollRight && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="다음 순위 영화 보기"
              onClick={() => move("right")}
              className="pointer-events-auto absolute right-2 top-1/2 z-20 h-20 w-14 -translate-y-1/2 rounded-xl bg-linear-to-l from-cinemo-bg/75 via-cinemo-bg/35 to-transparent text-cinemo-gold drop-shadow-lg backdrop-blur-[2px] transition-colors hover:bg-cinemo-teal/45 hover:text-cinemo-gold-light active:bg-cinemo-teal/60 max-sm:hidden max-sm:h-14 max-sm:w-14 max-sm:rounded-lg max-sm:border max-sm:border-cinemo-teal-light/15 max-sm:bg-cinemo-teal/25 max-sm:bg-none max-sm:text-cinemo-gold-light/85 max-sm:backdrop-blur-md max-sm:hover:bg-cinemo-teal/35 max-sm:active:bg-cinemo-teal/70 xl:hidden [&_svg]:size-6"
            >
              <ChevronRight />
            </Button>
          )}
        </>

        <ol
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pl-0 pr-0 pb-4 [-ms-overflow-style:none] scrollbar-none max-sm:snap-x max-sm:snap-mandatory [&::-webkit-scrollbar]:hidden"
        >
          {movies.map((movie, index) => (
            <li
              key={movie.id}
              className="w-34 shrink-0 sm:w-42 max-sm:w-[72vw] max-sm:snap-center"
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

                <div className="mt-1 space-y-1 text-sm">
                  {movie.totalAudienceCount !== null ? (
                    <p className="text-sm text-muted-foreground">
                      {formatAudienceCount(movie.totalAudienceCount)}
                    </p>
                  ) : null}

                  {movie.rankChange !== null && movie.rankChange !== 0 ? (
                    <p>
                      <RankChange value={movie.rankChange} />
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
