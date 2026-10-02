import { SourceProvider } from "@prisma/client";

import { TmdbMovieListItem } from "@/integrations/tmdb/types/tmdb-response.type";
import { CreateMovieFromProviderInput } from "../movies.repository";

const parseReleaseDate = (value: string): Date | null => {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
};

const hasKoreanText = (value: string): boolean => /[가-힣]/.test(value);

export const toCreateMovieFromTmdbInput = (
  movie: TmdbMovieListItem,
): CreateMovieFromProviderInput => ({
  sourceProvider: SourceProvider.TMDB,
  externalId: String(movie.id),
  title: movie.title,
  languageCode: hasKoreanText(movie.title) ? "ko" : movie.original_language,
  releaseDate: parseReleaseDate(movie.release_date),
  posterUrl: movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null,
  posterExternalId: movie.poster_path,
});
