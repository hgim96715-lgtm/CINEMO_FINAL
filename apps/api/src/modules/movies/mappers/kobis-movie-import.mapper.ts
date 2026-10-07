import { MovieVisibility } from "@prisma/client";

import type { KobisMovieInfoResponseDto } from "@/integrations/kobis/dto/responses/kobis-movie-info.response.dto";

import type { KobisMovieImportInput } from "../repositories/movies.repository";
import { getKobisMovieVisibility } from "../movie-content-policy";

const parseKobisDate = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const normalizedValue = value.replaceAll("-", "");

  if (!/^\d{8}$/.test(normalizedValue)) {
    return null;
  }

  const year = Number(normalizedValue.slice(0, 4));
  const month = Number(normalizedValue.slice(4, 6)) - 1;
  const day = Number(normalizedValue.slice(6, 8));

  return new Date(Date.UTC(year, month, day));
};

const KOBIS_NATION_CODE: Record<string, string> = {
  한국: "KR",
  일본: "JP",
  미국: "US",
  중국: "CN",
  영국: "GB",
  프랑스: "FR",
  독일: "DE",
};

const toProductionCountryCodes = (nations: string[]): string[] => [
  ...new Set(
    nations.map((nation) => KOBIS_NATION_CODE[nation]).filter(Boolean),
  ),
];

export const toKobisMovieImportInput = (
  movie: KobisMovieInfoResponseDto,
  options: { releaseDate?: string | null } = {},
): KobisMovieImportInput => {
  const moderation = getKobisMovieVisibility({
    title: movie.title,
    typeName: movie.typeName,
    genres: movie.genres,
    certifications: movie.certifications,
  });

  return {
    movieCd: movie.movieCd,
    title: movie.title,
    runningTime: movie.runningTime,
    releaseDate: parseKobisDate(
      options.releaseDate !== undefined
        ? options.releaseDate
        : movie.releaseDate,
    ),
    productionCountryCodes: toProductionCountryCodes(movie.nations),
    certifications: movie.certifications,
    genres: movie.genres,
    visibility: moderation.visibility,
    moderationReason: moderation.moderationReason,
    directors: movie.directors.map((person) => ({
      name: person.name,
      nameEn: person.nameEn,
    })),
    actors: movie.actors.map((person) => ({
      name: person.name,
      nameEn: person.nameEn,
    })),
  };
};
