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
import { activeCurationsQueryOptions } from "@/lib/queries/curation.query";
import type { Curation, CurationMovie } from "@/lib/api/curations";
import { getActiveCommemorativeCuration } from "@/lib/commemorative-curations";
import {
  TMDB_IMAGE_BASE_URL,
  usePlatformMovies,
} from "./PlatformMovieCollection";

type CurationKind = "commemorative" | "upcoming" | "platform";

const getValidMovies = (movies: MovieSearchItemResponse[] | undefined) =>
  (movies ?? []).filter((movie) => Boolean(movie.title && movie.posterUrl));

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

export function CurationHero() {
  const [activeKind, setActiveKind] =
    useState<CurationKind>("commemorative");
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
  const configuredCuration: Curation | undefined =
    activeCurationsQuery.data?.[0];
  const fallbackCuration = getActiveCommemorativeCuration();
  const commemorativeCuration = configuredCuration ?? fallbackCuration;
  const commemorativeQueries = useQueries({
    queries: (configuredCuration ? [] : fallbackCuration?.movieTitles ?? []).map(
      (title) =>
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
    () => platformMoviesWithProviders.map(({ movie }) => movie),
    [platformMoviesWithProviders],
  );
  const commemorativeMovies = useMemo(() => {
    if (configuredCuration) {
      return configuredCuration.movies
        .filter((movie) => Boolean(movie.title && movie.posterUrl))
        .map(toHeroMovie);
    }

    const movies = commemorativeQueries.flatMap(
      (query) => query.data?.items ?? [],
    );
    const movieMap = new Map<string, MovieSearchItemResponse>();

    for (const movie of movies) {
      if (movie.title && movie.posterUrl) {
        movieMap.set(movie.id, movie);
      }
    }

    return Array.from(movieMap.values());
  }, [configuredCuration, commemorativeQueries]);

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
        if (currentMovie && movies.some((movie) => movie.id === currentMovie.id)) {
          return currentMovie;
        }

        return pickRandomMovie(movies);
      });
    }
  }, [movieIds]);

  const featuredMovie = selectedMovie ?? movies[0];

  if ((upcomingQuery.isPending && platformMoviesPending) || !featuredMovie) {
    return (
      <section className="min-h-[clamp(30rem,52vw,42rem)] rounded-[2rem] bg-cinemo-surface/70" />
    );
  }

  const isUpcoming = currentKind === "upcoming";
  const isCommemorative = currentKind === "commemorative";
  const isLongTitle = featuredMovie.title.length > 16;
  const featuredPlatformProviders =
    platformMoviesWithProviders.find(
      ({ movie }) => movie.id === featuredMovie.id,
    )?.providers ?? [];

  const reshuffle = () => {
    setSelectedMovie(pickRandomMovie(movies));
  };

  const changeKind = (kind: CurationKind) => {
    setActiveKind(kind);
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
      className="relative isolate min-h-[clamp(30rem,52vw,42rem)] overflow-hidden rounded-[2rem] border border-cinemo-gold/25 bg-[#081918] text-cinemo-text shadow-[0_2rem_5rem_rgb(0_0_0_/28%),inset_0_1px_0_rgb(255_255_255_/10%)]"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_30%,rgb(199_161_75_/12%),transparent_30%),linear-gradient(135deg,rgb(5_20_19_/100%),rgb(8_25_24_/96%))]" />

      <div className="relative z-10 flex min-h-[clamp(30rem,52vw,42rem)] flex-col p-5 sm:p-8 lg:p-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-medium tracking-[0.32em] text-cinemo-gold sm:text-sm">
            CINEMO CURATION
          </p>

          <div className="flex items-center gap-2">
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
                  이번 주 극장
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

        <div className="grid flex-1 items-center gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:gap-12 lg:pt-5">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium text-cinemo-gold">
              {isCommemorative
                ? commemorativeCuration?.eyebrow
                : isUpcoming
                ? "이번 주 극장에서 만날 영화"
                : "플랫폼에서 볼 수 있는 영화"}
            </p>

            <h1
              id="cinemo-curation-title"
              className={`font-semibold text-cinemo-text break-keep text-balance ${
                isLongTitle
                  ? "max-w-[18ch] font-sans text-[clamp(2rem,4.2vw,4.25rem)] leading-[1.08] tracking-[-0.045em]"
                  : "max-w-[13ch] font-serif text-[clamp(2.5rem,6vw,5.75rem)] leading-[0.98] tracking-[-0.04em]"
              }`}
            >
              {featuredMovie.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              {isUpcoming ? (
                <span className="inline-flex items-center gap-2 text-cinemo-gold">
                  <CalendarDays className="size-4" />
                  {featuredMovie.releaseDate ?? "개봉일 미정"} 개봉 예정
                </span>
              ) : isCommemorative ? (
                <span className="max-w-md text-sm leading-7 text-cinemo-muted">
                  {commemorativeCuration?.description}
                </span>
              ) : (
                <span className="rounded-full border border-cinemo-gold/35 bg-cinemo-gold/10 px-3 py-1.5 text-cinemo-gold">
                  플랫폼 감상 가능
                </span>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/movies/${featuredMovie.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinemo-gold px-5 py-3.5 text-sm font-semibold text-cinemo-dark shadow-[0_0_2rem_rgb(199_161_75_/22%)] transition hover:bg-cinemo-gold-light sm:w-auto"
              >
                영화 자세히 보기
                <ArrowUpRight className="size-4" />
              </Link>

              {isUpcoming ? (
                <Link
                  href="/lobby/movies/upcoming"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-cinemo-text backdrop-blur-sm transition hover:border-cinemo-gold/60 hover:bg-white/10 sm:w-auto"
                >
                  전체 개봉 예정작
                </Link>
              ) : isCommemorative ? null : (
                <Link
                  href="/lobby/movies/platform"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-cinemo-text backdrop-blur-sm transition hover:border-cinemo-gold/60 hover:bg-white/10 sm:w-auto"
                >
                  플랫폼 영화 전체 보기
                </Link>
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[11rem] sm:max-w-[16rem] lg:max-w-[22rem]">
            <Link
              href={`/movies/${featuredMovie.id}`}
              className="group relative block overflow-hidden rounded-[1.35rem] border border-white/25 bg-black/40 shadow-[0_2rem_4rem_rgb(0_0_0_/44%)]"
            >
              <Image
                src={featuredMovie.posterUrl!}
                alt={`${featuredMovie.title} 포스터`}
                width={680}
                height={1020}
                sizes="(min-width: 1024px) 320px, 56vw"
                className="block aspect-[2/3] w-full object-contain bg-black transition duration-700 group-hover:scale-[1.03]"
                priority
              />
              {!isUpcoming && featuredPlatformProviders.length > 0 && (
                <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
                  {featuredPlatformProviders.map((provider) =>
                    provider.logoPath ? (
                      <Image
                        key={provider.provider}
                        src={`${TMDB_IMAGE_BASE_URL}${provider.logoPath}`}
                        alt={provider.label}
                        width={40}
                        height={40}
                        className="size-8 rounded-lg object-contain shadow-lg"
                      />
                    ) : (
                      <span
                        key={provider.provider}
                        className="rounded-lg bg-black/70 px-2 py-1 text-[10px] font-semibold text-white"
                      >
                        {provider.label}
                      </span>
                    ),
                  )}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/20 to-transparent px-4 pb-4 pt-14">
                <p className="truncate text-sm font-semibold text-white">
                  {featuredMovie.title}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
