import { CreditType, MediaType, SourceProvider } from "@prisma/client";

import {
  TmdbMovieCreditsResponse,
  TmdbMovieDetailResponse,
  TmdbMovieVideo,
} from "@/integrations/tmdb/types/tmdb-response.type";

import { SaveTmdbMovieInput } from "../repositories/tmdb-movie-sync.repository";

const TMDB_ACTOR_LIMIT = 10;

const hasKoreanName = (name: string): boolean => /[가-힣]/.test(name);

const parseReleaseDate = (value: string): Date | null =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

export const toSaveTmdbMovieInput = (
  tmdbMovie: TmdbMovieDetailResponse,
  tmdbCredits: TmdbMovieCreditsResponse,
  trailer: TmdbMovieVideo | null,
  tmdbMovieId: number,
): SaveTmdbMovieInput => {
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
