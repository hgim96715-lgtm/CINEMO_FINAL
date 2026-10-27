"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

import { CinemaRegionPieChart } from "@/components/insights/CinemaRegionPieChart";
import { GenrePieChart } from "@/components/insights/GenrePieChart";
import { PopularMovieBarChart } from "@/components/insights/PopularMovieBarChart";

import { HeroCarouselIndicators } from "./HeroCarouselIndicators";

export type HeroInsightKind = "cinema" | "genre" | "popular";

type HeroInsightSlideProps = {
  kind: HeroInsightKind;
  year: number;
  month: number;
  postcardIds: string[];
  activeIndex: number;
  cinemaRegionSlideIndex: number;
  genreAnalyticsSlideIndex: number;
  popularMoviesSlideIndex: number;
  onSelectSlide: (index: number) => void;
};

const INSIGHT_TITLES: Record<HeroInsightKind, string> = {
  cinema: "우리 지역에는 영화관이 몇 군데 있을까?",
  genre: "이번 달 개봉작 장르 TOP 5",
  popular: "인기 영화 TOP 5",
};

export function HeroInsightSlide({
  kind,
  year,
  month,
  postcardIds,
  activeIndex,
  cinemaRegionSlideIndex,
  genreAnalyticsSlideIndex,
  popularMoviesSlideIndex,
  onSelectSlide,
}: HeroInsightSlideProps) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col sm:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.28em] text-cinemo-gold">
            CINEMO INSIGHT
          </p>
          <h2
            className={`mt-3 font-semibold leading-tight text-cinemo-text ${
              kind === "cinema" ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {INSIGHT_TITLES[kind]}
          </h2>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center">
        {kind === "cinema" ? (
          <CinemaRegionPieChart compact />
        ) : kind === "genre" ? (
          <GenrePieChart compact year={year} month={month} />
        ) : (
          <PopularMovieBarChart />
        )}
      </div>

      {kind === "cinema" && (
        <Link
          href="/lobby/cinemas"
          className="mt-2 inline-flex shrink-0 items-center self-start rounded-lg border border-cinemo-gold/40 bg-cinemo-gold/10 px-3.5 py-2 text-xs font-medium text-cinemo-gold transition hover:border-cinemo-gold/70 hover:bg-cinemo-gold/15"
        >
          지도 보기
          <MapPin aria-hidden="true" className="ml-1 size-3.5" />
        </Link>
      )}

      <HeroCarouselIndicators
        postcardIds={postcardIds}
        activeIndex={activeIndex}
        cinemaRegionSlideIndex={cinemaRegionSlideIndex}
        genreAnalyticsSlideIndex={genreAnalyticsSlideIndex}
        popularMoviesSlideIndex={popularMoviesSlideIndex}
        onSelect={onSelectSlide}
      />
    </div>
  );
}
