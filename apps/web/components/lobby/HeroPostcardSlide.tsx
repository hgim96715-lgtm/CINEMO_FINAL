"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Postcard } from "@/lib/api/postcards";
import { PostcardQuoteContent } from "@/components/postcard/PostcardQuoteContent";
import { PostcardSceneMeta } from "@/components/postcard/PostcardSceneMeta";

import { HeroCarouselIndicators } from "./HeroCarouselIndicators";

type HeroPostcardSlideProps = {
  postcard: Postcard;
  activeIndex: number;
  postcardIds: string[];
  cinemaRegionSlideIndex: number;
  genreAnalyticsSlideIndex: number;
  popularMoviesSlideIndex: number;
  activeImageUrl?: string | null;
  activeImageAlt: string;
  hasMoreContent: boolean;
  onSelectSlide: (index: number) => void;
};

const formatPostcardDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll(" ", "");
};

export function HeroPostcardSlide({
  postcard,
  activeIndex,
  postcardIds,
  cinemaRegionSlideIndex,
  genreAnalyticsSlideIndex,
  popularMoviesSlideIndex,
  activeImageUrl,
  activeImageAlt,
  hasMoreContent,
  onSelectSlide,
}: HeroPostcardSlideProps) {
  return (
    <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col justify-between overflow-hidden sm:order-1 sm:justify-between">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <p className="text-xs tracking-[0.08em] text-cinemo-muted">
              {formatPostcardDate(postcard.createdAt)} ·{" "}
              {postcard.author?.nickname ?? "익명"}
            </p>
            <span className="rounded-full border border-cinemo-gold/40 bg-cinemo-gold/10 px-3 py-1 text-xs text-cinemo-gold sm:hidden">
              {postcard.type === "REVIEW"
                ? "감상"
                : postcard.type === "QUOTE"
                  ? "인용"
                  : "장면"}
            </span>
          </div>

          <div className="mt-5 flex min-h-0 items-end gap-4 sm:mt-5 sm:block">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-cinemo-gold drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)]">
                {postcard.movie?.title ?? "영화와 함께 남긴 기록"}
              </p>

              {postcard.type === "SCENE" && (
                <PostcardSceneMeta metadata={postcard.metadata} compact />
              )}

              {postcard.type === "QUOTE" ? (
                <PostcardQuoteContent
                  content={postcard.content}
                  metadata={postcard.metadata}
                  compact
                  compactQuoteLines={3}
                  compactTranslationLines={2}
                  className="mt-3 min-h-30 max-w-2xl overflow-hidden font-serif text-[clamp(1.25rem,5vw,1.35rem)] font-semibold leading-[1.2] text-white sm:h-60 sm:text-[clamp(1.7rem,3.5vw,2.8rem)]"
                />
              ) : (
                <blockquote
                  key={postcard.id}
                  className="mt-3 min-h-30 max-w-2xl line-clamp-3 overflow-hidden whitespace-pre-wrap font-serif text-[clamp(1.25rem,5vw,1.35rem)] font-semibold leading-[1.2] text-white sm:h-44 sm:text-[clamp(1.8rem,4vw,3.2rem)]"
                >
                  “{postcard.content}”
                </blockquote>
              )}
            </div>

            {activeImageUrl && (
              <div className="relative h-33 w-22 shrink-0 overflow-hidden rounded-[14px] bg-cinemo-surface sm:hidden">
                <Image
                  src={activeImageUrl}
                  alt={activeImageAlt}
                  fill
                  sizes="88px"
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </div>
        </div>

        {hasMoreContent && (
          <Link
            href={`/lobby/postcards/${postcard.id}`}
            className="mt-2 inline-flex shrink-0 text-sm font-medium text-cinemo-gold transition hover:text-cinemo-gold-light"
          >
            더보기
          </Link>
        )}
      </div>

      <div className="mt-4 flex shrink-0 items-end justify-between gap-4 sm:mt-6 sm:gap-6">
        <Link
          href="/lobby/postcards"
          className="mt-4 inline-flex items-center rounded-lg border bg-cinemo-gold/10 px-3.5 py-2 text-xs font-medium text-cinemo-gold transition hover:border-cinemo-gold/70 hover:bg-cinemo-gold/15"
        >
          엽서 둘러보기
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>

        <HeroCarouselIndicators
          postcardIds={postcardIds}
          activeIndex={activeIndex}
          cinemaRegionSlideIndex={cinemaRegionSlideIndex}
          genreAnalyticsSlideIndex={genreAnalyticsSlideIndex}
          popularMoviesSlideIndex={popularMoviesSlideIndex}
          onSelect={onSelectSlide}
        />
      </div>
    </div>
  );
}
