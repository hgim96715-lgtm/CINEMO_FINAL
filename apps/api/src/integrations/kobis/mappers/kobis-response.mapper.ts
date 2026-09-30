import type {
  KobisMovie,
  KobisMovieInfo,
} from "@/integrations/kobis/types/kobis.types";
import { KobisMovieSearchItemResponseDto } from "@/integrations/kobis/dto/responses/kobis-movie-search-item.response.dto";
import { KobisMovieInfoResponseDto } from "@/integrations/kobis/dto/responses/kobis-movie-info.response.dto";

function splitValues(value?: string): string[] {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

export function toKobisMovieSearchItemResponse(
  movie: KobisMovie,
): KobisMovieSearchItemResponseDto {
  return {
    movieCd: movie.movieCd,
    title: movie.movieNm,
    foreignTitle: movie.movieNmEn ?? null,
    productionYear: movie.prdtYear ?? null,
    releaseDate: movie.openDt ?? null,
    typeName: movie.typeNm ?? null,
    productionStatus: movie.prdtStatNm ?? null,
    nations: splitValues(movie.nationAlt),
    genres: splitValues(movie.genreAlt),
  };
}

function toNumber(value?: string): number | null {
  if (!value) return null;

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
}

export function toKobisMovieInfoResponse(
  movie: KobisMovieInfo,
): KobisMovieInfoResponseDto {
  return {
    movieCd: movie.movieCd,
    title: movie.movieNm,
    foreignTitle: movie.movieNmEn ?? null,
    originalTitle: movie.movieNmOg ?? null,
    runningTime: toNumber(movie.showTm),
    productionYear: movie.prdtYear ?? null,
    releaseDate: movie.openDt ?? null,
    productionStatus: movie.prdtStatNm ?? null,
    typeName: movie.typeNm ?? null,
    nations: movie.nations?.map((nation) => nation.nationNm) ?? [],
    genres: movie.genres?.map((genre) => genre.genreNm) ?? [],
    directors:
      movie.directors?.map((director) => ({
        name: director.peopleNm,
        nameEn: director.peopleNmEn ?? null,
      })) ?? [],
    actors:
      movie.actors?.map((actor) => ({
        name: actor.peopleNm,
        nameEn: actor.peopleNmEn ?? null,
      })) ?? [],
    companies: movie.companies?.map((company) => company.companyNm ?? "") ?? [],
    certifications: movie.audits?.map((audit) => audit.watchGradeNm) ?? [],
  };
}
