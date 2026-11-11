"use client";

import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, Shuffle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  movieSearchQueryOptions,
  upcomingMoviesQueryOptions,
} from "@/lib/queries/movie-search.query";
import { movieDetailQueryOptions } from "@/lib/queries/movie-detail.query";
import { activeCurationsQueryOptions } from "@/lib/queries/curation.query";
import type { Curation, CurationMovie } from "@/lib/api/curations";
import {
  getActiveCommemorativeCuration,
  getCommemorativeMovieReason,
} from "@/lib/commemorative-curations";
import {
  getMovieProviders,
  PlatformLogoBadge,
  usePlatformMovies,
} from "./PlatformMovieCollection";
import { getPlatformLogoSrc } from "@/lib/platform-logo";

export type CurationKind = "commemorative" | "upcoming" | "platform";

type HeroMovieCandidate = Pick<MovieSearchItemResponse, "title" | "posterUrl">;

const JAPANESE_SCRIPT_PATTERN = /[\u3040-\u30ff\uff66-\uff9f]/u;

// 한국어 현지화가 없는 일본어 원제는 공개 로비 Hero 후보에서 제외함.
const isPublicHeroMovie = (movie: HeroMovieCandidate) =>
  Boolean(
    movie.title?.trim() &&
    movie.posterUrl &&
    !JAPANESE_SCRIPT_PATTERN.test(movie.title),
  );

const getValidMovies = (movies: MovieSearchItemResponse[] | undefined) =>
  (movies ?? []).filter(isPublicHeroMovie);

const pickRandomMovie = (movies: MovieSearchItemResponse[]) => {
  if (movies.length === 0) return undefined;

  return movies[Math.floor(Math.random() * movies.length)];
};

function toHeroMovie(movie: CurationMovie): MovieSearchItemResponse {
  return {
    id: movie.id,
    title: movie.title,
    releaseDate: movie.releaseDate,
    posterUrl: movie.posterUrl,
    genres: [],
    rank: null,
    rankChange: null,
    audienceCount: null,
    totalAudienceCount: null,
    hasTrailer: false,
    isAdultOnly: false,
    watchOptions: [],
  };
}

type CurationHeroProps = {
  activeKind?: CurationKind;
  showKindTabs?: boolean;
  embedded?: boolean;
};

function CurationHeroSkeleton({ embedded }: Pick<CurationHeroProps, "embedded">) {
  return (
    <section
      aria-busy="true"
      aria-label="CINEMO 큐레이션 불러오는 중"
      className={`relative isolate min-h-[clamp(30rem,42vw,36rem)] overflow-hidden bg-[#081918] text-cinemo-text ${
        embedded
          ? ""
          : "rounded-[2rem] border border-cinemo-gold/25 shadow-[0_2rem_5rem_rgb(0_0_0_/28%),inset_0_1px_0_rgb(255_255_255_/10%)]"
      }`}
    >
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_76%_30%,rgb(199_161_75_/12%),transparent_30%),linear-gradient(135deg,rgb(5_20_19_/100%),rgb(8_25_24_/96%))]" />
      <div className="relative flex min-h-[clamp(30rem,42vw,36rem)] flex-col p-5 sm:p-8 lg:p-12">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-[0.32em] text-cinemo-gold sm:text-sm">CINEMO CURATION</p>
          <div className="cinemo-loading-orbit size-8 rounded-full border-2 border-cinemo-gold/25 border-t-cinemo-gold" />
        </div>
        <div className="grid flex-1 items-center gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] lg:gap-16 lg:pt-3">
          <div className="space-y-4">
            <div className="cinemo-skeleton h-4 w-36 rounded-full" />
            <div className="cinemo-skeleton h-12 w-[min(31rem,86%)] rounded-2xl sm:h-16" />
            <div className="space-y-2 pt-2">
              <div className="cinemo-skeleton h-4 w-[min(27rem,78%)] rounded-full" />
              <div className="cinemo-skeleton h-4 w-[min(21rem,64%)] rounded-full" />
            </div>
          </div>
          <div className="cinemo-skeleton mx-auto aspect-[2/3] w-full max-w-[11rem] rounded-[1.35rem] sm:max-w-[16rem] lg:max-w-[20rem]" />
        </div>
      </div>
      <span className="sr-only">오늘의 큐레이션을 준비하는 중</span>
    </section>
  );
}

export function CurationHero({
  activeKind: controlledKind,
  showKindTabs = true,
  embedded = false,
}: CurationHeroProps = {}) {
  const [uncontrolledKind, setUncontrolledKind] =
    useState<CurationKind>("commemorative");
  const activeKind = controlledKind ?? uncontrolledKind;
  const [selectedMovie, setSelectedMovie] = useState<
    MovieSearchItemResponse | undefined
  >();

  const activeCurationsQuery = useQuery(activeCurationsQueryOptions());
  const upcomingQuery = useQuery(
    upcomingMoviesQueryOptions({ page: 1, limit: 20 }),
  );
  const {
    movies: platformMoviesWithProviders,
    isPending: platformMoviesPending,
  } = usePlatformMovies(20);
  const configuredCurations = activeCurationsQuery.data ?? [];
  const configuredCuration: Curation | undefined = configuredCurations[0];
  const fallbackCuration = getActiveCommemorativeCuration();
  const commemorativeCuration = configuredCuration ?? fallbackCuration;
  const commemorativeQueries = useQueries({
    queries: (configuredCuration
      ? []
      : (fallbackCuration?.movieTitles ?? [])
    ).map((title) =>
      movieSearchQueryOptions({
        query: title,
        page: 1,
        limit: 5,
      }),
    ),
  });

  const upcomingMovies = useMemo(
    () => getValidMovies(upcomingQuery.data?.items),
    [upcomingQuery.data?.items],
  );
  const platformMovies = useMemo(
    () =>
      platformMoviesWithProviders
        .map(({ movie }) => movie)
        .filter(isPublicHeroMovie),
    [platformMoviesWithProviders],
  );
  const commemorativeMovies = useMemo(() => {
    if (configuredCuration) {
      const movieMap = new Map<string, MovieSearchItemResponse>();

      for (const curation of configuredCurations) {
        for (const movie of curation.movies) {
          if (isPublicHeroMovie(movie)) {
            movieMap.set(movie.id, toHeroMovie(movie));
          }
        }
      }

      return Array.from(movieMap.values());
    }

    const movies = commemorativeQueries.flatMap(
      (query) => query.data?.items ?? [],
    );
    const movieMap = new Map<string, MovieSearchItemResponse>();

    for (const movie of movies) {
      if (isPublicHeroMovie(movie)) {
        movieMap.set(movie.id, movie);
      }
    }

    return Array.from(movieMap.values());
  }, [configuredCuration, configuredCurations, commemorativeQueries]);

  const hasCommemorativeMovies = commemorativeMovies.length > 0;
  const hasUpcomingMovies = upcomingMovies.length > 0;
  const hasPlatformMovies = platformMovies.length > 0;
  const currentKind: CurationKind =
    activeKind === "commemorative" && !hasCommemorativeMovies
      ? hasUpcomingMovies
        ? "upcoming"
        : "platform"
      : activeKind === "upcoming" && !hasUpcomingMovies
        ? hasCommemorativeMovies
          ? "commemorative"
          : "platform"
        : activeKind === "platform" && !hasPlatformMovies
          ? hasCommemorativeMovies
            ? "commemorative"
            : "upcoming"
          : activeKind;
  const movies =
    currentKind === "commemorative"
      ? commemorativeMovies
      : currentKind === "upcoming"
        ? upcomingMovies
        : platformMovies;
  const movieIds = movies.map((movie) => movie.id).join("|");

  useEffect(() => {
    if (movies.length > 0) {
      setSelectedMovie((currentMovie) => {
        if (
          currentMovie &&
          movies.some((movie) => movie.id === currentMovie.id)
        ) {
          return currentMovie;
        }

        return pickRandomMovie(movies);
      });
    }
  }, [movieIds]);

  const featuredMovie = selectedMovie ?? movies[0];
  const isUpcoming = currentKind === "upcoming";
  const isCommemorative = currentKind === "commemorative";
  const featuredMovieDetailQuery = useQuery({
    ...movieDetailQueryOptions(featuredMovie?.id ?? ""),
    enabled: isCommemorative && Boolean(featuredMovie?.id),
  });

  const isCommemorativePending = activeCurationsQuery.isPending ||
    (!configuredCuration && commemorativeQueries.some((query) => query.isPending));
  const isCurrentKindPending =
    (activeKind === "commemorative" && isCommemorativePending) ||
    (activeKind === "upcoming" && upcomingQuery.isPending) ||
    (activeKind === "platform" && platformMoviesPending);

  if (isCurrentKindPending) {
    return <CurationHeroSkeleton embedded={embedded} />;
  }

  // 로딩이 끝났는데 후보가 없으면 빈 큰 영역을 남기지 않음.
  // 스켈레톤은 네트워크 대기 중에만 보여 주어 화면 높이가 갑자기 바뀌는 것을 막음.
  if (!featuredMovie) {
    return null;
  }

  const isLongTitle = featuredMovie.title.length > 16;
  const featuredCuration = configuredCurations.find((curation) =>
    curation.movies.some((movie) => movie.id === featuredMovie.id),
  );
  const displayedCommemorativeCuration =
    featuredCuration ?? commemorativeCuration;
  const featuredCurationMovie = featuredCuration?.movies.find(
    (movie) => movie.id === featuredMovie.id,
  );
  const commemorativeMovieReason = isCommemorative
    ? featuredCurationMovie?.reason ||
      getCommemorativeMovieReason(fallbackCuration, featuredMovie.title)
    : null;
  const commemorativeCurationDescription = isCommemorative
    ? displayedCommemorativeCuration?.description?.trim() || null
    : null;
  const platformMovieProviders = platformMoviesWithProviders.find(
    ({ movie }) => movie.id === featuredMovie.id,
  )?.providers;
  const featuredPlatformProviders = platformMovieProviders?.length
    ? platformMovieProviders
    : getMovieProviders(featuredMovieDetailQuery.data ?? { watchOptions: [] });

  const reshuffle = () => {
    setSelectedMovie(pickRandomMovie(movies));
  };

  const changeKind = (kind: CurationKind) => {
    setUncontrolledKind(kind);
    const nextMovies =
      kind === "commemorative"
        ? commemorativeMovies
        : kind === "upcoming"
          ? upcomingMovies
          : platformMovies;
    setSelectedMovie(pickRandomMovie(nextMovies));
  };

  return (
    <section
      aria-labelledby="cinemo-curation-title"
      className={`relative isolate min-h-[clamp(30rem,42vw,36rem)] overflow-hidden bg-[#081918] text-cinemo-text ${
        embedded
          ? ""
          : "rounded-[2rem] border border-cinemo-gold/25 shadow-[0_2rem_5rem_rgb(0_0_0_/28%),inset_0_1px_0_rgb(255_255_255_/10%)]"
      }`}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_30%,rgb(199_161_75_/12%),transparent_30%),linear-gradient(135deg,rgb(5_20_19_/100%),rgb(8_25_24_/96%))]" />

      <div className="relative z-10 flex min-h-[clamp(30rem,42vw,36rem)] flex-col p-5 sm:p-8 lg:p-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-medium tracking-[0.32em] text-cinemo-gold sm:text-sm">
            CINEMO CURATION
          </p>

          <div className="flex items-center gap-2">
            {showKindTabs && (
              <div className="flex rounded-full border border-white/15 bg-black/25 p-1 backdrop-blur-md">
                {hasCommemorativeMovies && commemorativeCuration && (
                  <button
                    type="button"
                    aria-pressed={currentKind === "commemorative"}
                    onClick={() => changeKind("commemorative")}
                    className={`rounded-full px-3 py-1.5 text-xs transition sm:px-4 sm:text-sm ${
                      currentKind === "commemorative"
                        ? "bg-cinemo-gold font-semibold text-cinemo-dark shadow-lg"
                        : "text-cinemo-muted hover:text-cinemo-text"
                    }`}
                  >
                    기념일
                  </button>
                )}
                {hasUpcomingMovies && (
                  <button
                    type="button"
                    aria-pressed={currentKind === "upcoming"}
                    onClick={() => changeKind("upcoming")}
                    className={`rounded-full px-3 py-1.5 text-xs transition sm:px-4 sm:text-sm ${
                      currentKind === "upcoming"
                        ? "bg-cinemo-gold font-semibold text-cinemo-dark shadow-lg"
                        : "text-cinemo-muted hover:text-cinemo-text"
                    }`}
                  >
                    개봉 예정
                  </button>
                )}
                {hasPlatformMovies && (
                  <button
                    type="button"
                    aria-pressed={currentKind === "platform"}
                    onClick={() => changeKind("platform")}
                    className={`rounded-full px-3 py-1.5 text-xs transition sm:px-4 sm:text-sm ${
                      currentKind === "platform"
                        ? "bg-cinemo-gold font-semibold text-cinemo-dark shadow-lg"
                        : "text-cinemo-muted hover:text-cinemo-text"
                    }`}
                  >
                    플랫폼
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              aria-label="다른 영화 보기"
              onClick={reshuffle}
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/25 text-cinemo-muted backdrop-blur-md transition hover:border-cinemo-gold/60 hover:text-cinemo-gold"
            >
              <Shuffle className="size-4" />
            </button>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] lg:gap-16 lg:pt-3">
          <div className="max-w-2xl">
            {isCommemorative && displayedCommemorativeCuration?.eyebrow?.trim() && (
              <p className="mb-4 text-sm font-medium text-cinemo-gold">
                {displayedCommemorativeCuration.eyebrow}
              </p>
            )}

            {isCommemorative && displayedCommemorativeCuration?.title && (
              <p className="mb-5 max-w-2xl text-[clamp(1.35rem,2.7vw,2.5rem)] font-serif leading-tight tracking-[-0.03em] text-cinemo-text/90">
                {displayedCommemorativeCuration.title}
              </p>
            )}

            {commemorativeCurationDescription && (
              <p className="mb-5 max-w-xl text-sm leading-7 text-cinemo-muted sm:text-base">
                {commemorativeCurationDescription}
              </p>
            )}

            <h1
              id="cinemo-curation-title"
              className={`font-semibold text-cinemo-text break-keep text-balance ${
                isLongTitle
                  ? "max-w-[18ch] font-sans text-[clamp(2rem,4.2vw,4.25rem)] leading-[1.08] tracking-[-0.045em]"
                  : "max-w-[13ch] font-serif text-[clamp(2.5rem,5vw,5rem)] leading-[0.98] tracking-[-0.04em]"
              }`}
            >
              {featuredMovie.title}
            </h1>

            {isUpcoming ? (
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 text-cinemo-gold">
                  <CalendarDays className="size-4" />
                  {featuredMovie.releaseDate ?? "개봉일 미정"} 개봉 예정
                </span>
              </div>
            ) : isCommemorative && commemorativeMovieReason ? (
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                <span className="max-w-xl text-sm leading-7 text-cinemo-muted sm:text-base">
                  {commemorativeMovieReason}
                </span>
              </div>
            ) : null}

            {!isCommemorative && (
              <div className="mt-8 hidden flex-wrap gap-3 lg:flex">
                <Link
                  href={`/movies/${featuredMovie.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cinemo-gold px-5 py-3.5 text-sm font-semibold text-cinemo-dark shadow-[0_0_2rem_rgb(199_161_75_/22%)] transition hover:bg-cinemo-gold-light"
                >
                  영화 자세히 보기
                  <ArrowUpRight className="size-4" />
                </Link>

                <Link
                  href={
                    isUpcoming
                      ? "/lobby/movies/upcoming"
                      : "/lobby/movies/platform"
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-cinemo-text backdrop-blur-sm transition hover:border-cinemo-gold/60 hover:bg-white/10"
                >
                  {isUpcoming ? "전체 개봉 예정작" : "플랫폼 영화 전체 보기"}
                </Link>
              </div>
            )}
          </div>

          <div className="mx-auto w-full max-w-[11rem] sm:max-w-[16rem] lg:max-w-[20rem]">
            <Link
              href={`/movies/${featuredMovie.id}`}
              className="group relative block overflow-hidden rounded-[1.35rem] border border-cinemo-gold/35 bg-black/40 shadow-[0_2rem_4rem_rgb(0_0_0_/44%)]"
            >
              <Image
                src={featuredMovie.posterUrl!}
                alt={`${featuredMovie.title} 포스터`}
                width={680}
                height={1020}
                sizes="(min-width: 1024px) 320px, 56vw"
                className="block aspect-[2/3] w-full object-cover bg-black"
                priority
              />
            </Link>

            {!isUpcoming && featuredPlatformProviders.length > 0 && (
              <div className="mt-2 flex w-fit max-w-full flex-wrap gap-1.5">
                {featuredPlatformProviders.map((provider) =>
                  getPlatformLogoSrc(provider.provider, provider.logoPath) ? (
                    <PlatformLogoBadge
                      key={provider.provider}
                      provider={provider}
                    />
                  ) : null,
                )}
              </div>
            )}

            {!isCommemorative && (
              <div className="mt-4 flex flex-col gap-3 lg:hidden">
                <Link
                  href={`/movies/${featuredMovie.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinemo-gold px-5 py-3.5 text-sm font-semibold text-cinemo-dark shadow-[0_0_2rem_rgb(199_161_75_/22%)] transition hover:bg-cinemo-gold-light"
                >
                  영화 자세히 보기
                  <ArrowUpRight className="size-4" />
                </Link>

                <Link
                  href={
                    isUpcoming
                      ? "/lobby/movies/upcoming"
                      : "/lobby/movies/platform"
                  }
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-cinemo-text backdrop-blur-sm transition hover:border-cinemo-gold/60 hover:bg-white/10"
                >
                  {isUpcoming ? "전체 개봉 예정작" : "플랫폼 영화 전체 보기"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
