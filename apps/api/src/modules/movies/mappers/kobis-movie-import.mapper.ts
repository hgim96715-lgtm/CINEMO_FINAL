import type { KobisMovieInfoResponseDto } from "@/integrations/kobis/dto/responses/kobis-movie-info.response.dto";

import type { KobisMovieImportInput } from "../repositories/movies.repository";

const parseKobisDate = (value: string | null): Date | null => {
  if (!value || !/^\d{8}$/.test(value)) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));

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
): KobisMovieImportInput => ({
  movieCd: movie.movieCd,
  title: movie.title,
  runningTime: movie.runningTime,
  releaseDate: parseKobisDate(movie.releaseDate),
  productionCountryCodes: toProductionCountryCodes(movie.nations),
  certifications: movie.certifications,
  genres: movie.genres,
  directors: movie.directors.map((person) => ({
    name: person.name,
    nameEn: person.nameEn,
  })),
  actors: movie.actors.map((person) => ({
    name: person.name,
    nameEn: person.nameEn,
  })),
});
