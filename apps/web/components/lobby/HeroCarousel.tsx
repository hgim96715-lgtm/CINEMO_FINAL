"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { postcardFeedQueryOptions } from "@/lib/queries/postcard-feed.query";

import { HeroInsightSlide, type HeroInsightKind } from "./HeroInsightSlide";
import { HeroPostcardSlide } from "./HeroPostcardSlide";

const AUTO_PLAY_INTERVAL = 6_000;

function getKoreaYearMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { data, isPending, isError } = useInfiniteQuery(
    postcardFeedQueryOptions(),
  );

  const postcards =
    data?.pages.flatMap((page) => page.items).slice(0, 2) ?? [];
  const postcardIds = postcards.map((postcard) => postcard.id);
  const cinemaRegionSlideIndex = postcards.length;
  const genreAnalyticsSlideIndex = postcards.length + 1;
  const popularMoviesSlideIndex = postcards.length + 2;
  const carouselItemCount = postcards.length + 3;
  const activePostcard = postcards[activeIndex] ?? postcards[0];
  const activeInsightKind: HeroInsightKind | null =
    activeIndex === cinemaRegionSlideIndex
      ? "cinema"
      : activeIndex === genreAnalyticsSlideIndex
        ? "genre"
        : activeIndex === popularMoviesSlideIndex
          ? "popular"
          : null;
  const isSpecialSlide = activeInsightKind !== null;
  const { year, month } = getKoreaYearMonth();

  const activeImageUrl =
    activePostcard?.movie?.posterUrl ?? activePostcard?.media[0]?.url;
  const activeImageAlt =
    activePostcard?.media[0]?.altText ??
    `${activePostcard?.movie?.title ?? "영화"} 포스터`;
  const activeTranslation =
    activePostcard?.metadata?.type === "QUOTE"
      ? (activePostcard.metadata.translations?.find(
          (translation) => translation.language.toLowerCase() === "ko",
        )?.content ?? "")
      : "";
  const hasMoreContent = activePostcard
    ? activePostcard.type === "QUOTE"
      ? activePostcard.content.length > 90 ||
        activeTranslation.length > 90 ||
        activeTranslation.split(/\r?\n/).length > 3
      : activePostcard.content.length > 160
    : false;

  useEffect(() => {
    if (activeIndex >= carouselItemCount) {
      setActiveIndex(0);
    }
  }, [activeIndex, carouselItemCount]);

  useEffect(() => {
    if (carouselItemCount <= 1 || isPaused) {
      return;
    }

    const timerId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % carouselItemCount);
    }, AUTO_PLAY_INTERVAL);

    return () => window.clearInterval(timerId);
  }, [carouselItemCount, isPaused]);

  if (isPending) {
    return (
      <section className="min-h-[clamp(22rem,42vw,28rem)] rounded-[2rem] bg-cinemo-surface/70" />
    );
  }

  if (isError || (!activePostcard && !isSpecialSlide)) {
    return (
      <section className="flex min-h-[clamp(22rem,42vw,28rem)] items-center rounded-[2rem] bg-cinemo-surface px-8 py-12 sm:px-14">
        <div className="max-w-xl">
          <p className="text-xs tracking-[0.28em] text-primary">
            CINEMO POSTCARD
          </p>

          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight text-cinemo-text sm:text-5xl">
            영화에 대한 마음을
            <br />한 장의 엽서에 남겨보세요.
          </h1>

          <Link
            href="/lobby/postcards"
            className="mt-8 inline-flex items-center rounded-lg border border-cinemo-gold/40 bg-cinemo-gold/10 px-3.5 py-2 text-xs font-medium text-cinemo-gold transition hover:border-cinemo-gold/70 hover:bg-cinemo-gold/15"
          >
            엽서 둘러보기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative isolate mx-1 mt-5 min-h-77.5 overflow-hidden rounded-3xl border border-white/10 bg-white/6 text-cinemo-text shadow-[0_2rem_5rem_rgb(0_0_0_/24%)] backdrop-blur-xl sm:mx-0 sm:mt-0 sm:h-[clamp(28rem,44vw,34rem)] sm:rounded-[2rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(120deg,rgb(8_25_24_/96%)_0%,rgb(8_25_24_/88%)_58%,rgb(8_25_24_/78%)_100%)]"
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col gap-4 p-5 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)] sm:grid-rows-1 sm:gap-10 sm:p-10 lg:p-14">
        {isSpecialSlide ? (
          <HeroInsightSlide
            kind={activeInsightKind}
            year={year}
            month={month}
            postcardIds={postcardIds}
            activeIndex={activeIndex}
            cinemaRegionSlideIndex={cinemaRegionSlideIndex}
            genreAnalyticsSlideIndex={genreAnalyticsSlideIndex}
            popularMoviesSlideIndex={popularMoviesSlideIndex}
            onSelectSlide={setActiveIndex}
          />
        ) : (
          <HeroPostcardSlide
            postcard={activePostcard}
            activeIndex={activeIndex}
            postcardIds={postcardIds}
            cinemaRegionSlideIndex={cinemaRegionSlideIndex}
            genreAnalyticsSlideIndex={genreAnalyticsSlideIndex}
            popularMoviesSlideIndex={popularMoviesSlideIndex}
            activeImageUrl={activeImageUrl}
            activeImageAlt={activeImageAlt}
            hasMoreContent={hasMoreContent}
            onSelectSlide={setActiveIndex}
          />
        )}

        <div
          className={`relative order-1 hidden w-full items-center justify-center sm:order-2 sm:flex ${
            isSpecialSlide ? "!hidden" : ""
          }`}
        >
          {activeImageUrl ? (
            <div className="relative flex h-full w-full items-center justify-center">
              <div className="relative aspect-2/3 h-full max-h-full w-auto max-w-full rotate-1 overflow-hidden rounded-[1.75rem] transition-transform duration-500 hover:rotate-0">
                <Image
                  src={activeImageUrl}
                  alt={activeImageAlt}
                  fill
                  sizes="(max-width: 1024px) 44vw, 520px"
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full max-w-lg items-center justify-center text-sm text-cinemo-muted">
              포스터 준비중
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
