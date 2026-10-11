import {
  AvailabilityType,
  CreditType,
  MediaType,
  SourceProvider,
  WatchProvider,
} from "@prisma/client";

import {
  TmdbMovieCreditsResponse,
  TmdbMovieDetailResponse,
  TmdbMovieVideo,
  TmdbMovieWatchProvidersResponse,
} from "@/integrations/tmdb/types/tmdb-response.type";

import {SaveTmdbMovieInput} from "../repositories/tmdb-movie-sync.repository";

const TMDB_ACTOR_LIMIT = 10;

const hasKoreanName = (name: string): boolean => /[가-힣]/.test(name);

const parseReleaseDate = (value: string): Date | null =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

const toWatchProvider = (providerName: string): WatchProvider | null => {
  const normalizedName = providerName.toUpperCase();

  if (normalizedName === "NETFLIX") return WatchProvider.NETFLIX;
  if (normalizedName === "WATCHA") return WatchProvider.WATCHA;
  if (normalizedName === "TVING") return WatchProvider.TVING;
  if (normalizedName === "DISNEY PLUS" || normalizedName === "DISNEY+") {
    return WatchProvider.DISNEY_PLUS;
  }
  if (normalizedName === "WAVVE") return WatchProvider.WAVVE;
  if (normalizedName === "APPLE TV") return WatchProvider.APPLE_TV;
  if (
    normalizedName === "AMAZON PRIME VIDEO" ||
    normalizedName === "PRIME VIDEO"
  ) {
    return WatchProvider.PRIME_VIDEO;
  }

  return null;
};

const toAvailabilityType = (
  type: "flatrate" | "rent" | "buy" | "free" | "ads",
): AvailabilityType => {
  if (type === "rent") return AvailabilityType.RENT;
  if (type === "buy") return AvailabilityType.BUY;

  return AvailabilityType.STREAM;
};

export const toSaveTmdbMovieInput = (
  tmdbMovie: TmdbMovieDetailResponse,
  tmdbCredits: TmdbMovieCreditsResponse,
  trailer: TmdbMovieVideo | null,
  tmdbMovieId: number,
  tmdbWatchProviders: TmdbMovieWatchProvidersResponse,
): SaveTmdbMovieInput => {
  const koreanProviders = tmdbWatchProviders.results.KR ?? null;
  const watchOptions: SaveTmdbMovieInput["watchOptions"] = [];

  if (koreanProviders) {
    const providerGroups = [
      {type: "flatrate" as const, providers: koreanProviders.flatrate ?? []},
      {type: "rent" as const, providers: koreanProviders.rent ?? []},
      {type: "buy" as const, providers: koreanProviders.buy ?? []},
      {type: "free" as const, providers: koreanProviders.free ?? []},
      {type: "ads" as const, providers: koreanProviders.ads ?? []},
    ];

    for (const group of providerGroups) {
      for (const provider of group.providers) {
        const watchProvider = toWatchProvider(provider.provider_name);

        if (!watchProvider) continue;

        watchOptions.push({
          watchProvider,
          tmdbProviderId: provider.provider_id,
          logoPath: provider.logo_path ?? null,
          availabilityType: toAvailabilityType(group.type),
          regionCode: "KR",
          url: koreanProviders.link,
        });
      }
    }
  }
  const directors = tmdbCredits.crew
    .filter(
      (person) =>
        person.department === "Directing" && person.job === "Director",
    )
    .filter((person) => hasKoreanName(person.name))
    .map((person) => ({
      name: person.name,
      nameEn: person.original_name ?? null,
      externalId: String(person.id),
      creditType: CreditType.DIRECTOR,
      characterName: null,
    }));

  const actors = [...tmdbCredits.cast]
    .sort((a, b) => a.order - b.order)
    .filter((person) => hasKoreanName(person.name))
    .slice(0, TMDB_ACTOR_LIMIT)
    .map((person) => ({
      name: person.name,
      nameEn: person.original_name ?? null,
      externalId: String(person.id),
      creditType: CreditType.ACTOR,
      characterName: person.character?.trim() || null,
    }));

  const media: SaveTmdbMovieInput["media"] = [];

  if (tmdbMovie.poster_path) {
    media.push({
      mediaType: MediaType.POSTER,
      sourceProvider: SourceProvider.TMDB,
      url: `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`,
      externalId: tmdbMovie.poster_path,
    });
  }

  if (tmdbMovie.backdrop_path) {
    media.push({
      mediaType: MediaType.BACKDROP,
      sourceProvider: SourceProvider.TMDB,
      url: `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}`,
      externalId: tmdbMovie.backdrop_path,
    });
  }

  if (trailer) {
    media.push({
      mediaType: MediaType.TRAILER,
      sourceProvider: SourceProvider.YOUTUBE,
      url: `https://www.youtube.com/watch?v=${trailer.key}`,
      externalId: trailer.key,
    });
  }
  return {
    tmdbMovieId,
    releaseDate: parseReleaseDate(tmdbMovie.release_date),
    title: tmdbMovie.title || null,
    originalTitle: tmdbMovie.original_title || null,
    originalLanguage: tmdbMovie.original_language,
    genres: tmdbMovie.genres,
    credits: [...directors, ...actors],
    media,
    watchOptions,
    overview: tmdbMovie.overview?.trim() || null,
    runtime: tmdbMovie.runtime,
    voteAverage: tmdbMovie.vote_average,
    voteCount: tmdbMovie.vote_count,
    productionCountryCodes: [
      ...new Set(
        tmdbMovie.production_countries
          .map((country) => country.iso_3166_1)
          .filter(Boolean),
      ),
    ],
  };
};
