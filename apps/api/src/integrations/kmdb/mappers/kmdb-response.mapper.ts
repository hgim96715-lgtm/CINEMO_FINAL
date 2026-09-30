import type {
  KmdbMovieResult,
  KmdbPerson,
  KmdbSearchResponse,
} from "../types/kmdb-response.type";
import type { KmdbMovieSearchItemResponseDto } from "../dto/responses/kmdb-movie-search-item.response.dto";
import type { KmdbMovieSearchResponseDto } from "../dto/responses/kmdb-movie-search.response.dto";

const getPersonName = (person: KmdbPerson): string | null =>
  person.directorEnNm ?? person.actorNm ?? null;

const toNumberOrNull = (value?: string): number | null => {
  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? null : numberValue;
};

const getKoreanPlot = (movie: KmdbMovieResult): string | null => {
  const plots = movie.plots?.plot ?? [];

  return (
    plots.find((plot) => plot.plotLang === "한국어")?.plotText ??
    plots[0]?.plotText ??
    null
  );
};

const toStringArray = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return value
    ? value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
};

const cleanKmdbText = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  return value
    .replace(/!HS|!HE/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const toKmdbMovieSearchItemResponseDto = (
  movie: KmdbMovieResult,
): KmdbMovieSearchItemResponseDto => ({
  docId: movie.DOCID,
  title: cleanKmdbText(movie.title),
  titleEng: cleanKmdbText(movie.titleEng),
  titleOrg: cleanKmdbText(movie.titleOrg),
  productionYear: movie.prodYear ?? null,
  nation: cleanKmdbText(movie.nation),
  runtime: toNumberOrNull(movie.runtime),
  rating: cleanKmdbText(movie.rating),
  ratings: (movie.ratings?.rating ?? []).map((rating) => ({
    ratingMain: rating.ratingMain ?? null,
    ratingDate: rating.ratingDate ?? null,
    ratingNo: rating.ratingNo ?? null,
    ratingGrade: cleanKmdbText(rating.ratingGrade),
    releaseDate: rating.releaseDate ?? null,
    runtime: rating.runtime ?? null,
  })),
  genres: movie.genre
    ? movie.genre
        .split(",")
        .map((genre) => cleanKmdbText(genre))
        .filter((genre): genre is string => Boolean(genre))
    : [],
  directors: (movie.directors?.director ?? [])
    .map(getPersonName)
    .map((name) => cleanKmdbText(name))
    .filter((name): name is string => Boolean(name)),
  actors: (movie.actors?.actor ?? [])
    .map(getPersonName)
    .filter((name): name is string => Boolean(name)),
  posterUrls: toStringArray(movie.posters),
  plot: cleanKmdbText(getKoreanPlot(movie)),
  kmdbUrl: movie.kmdbUrl ?? null,
});

export const toKmdbMovieSearchResponseDto = (
  response: KmdbSearchResponse,
): KmdbMovieSearchResponseDto => {
  const data = response.Data?.[0];

  return {
    totalCount: data?.TotalCount ?? response.TotalCount ?? 0,
    results: (data?.Result ?? []).map(toKmdbMovieSearchItemResponseDto),
  };
};
