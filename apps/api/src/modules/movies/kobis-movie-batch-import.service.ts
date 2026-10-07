import { Injectable, Logger } from "@nestjs/common";
import { SourceProvider } from "@prisma/client";

import { KobisService } from "@/integrations/kobis/kobis.service";
import { TmdbService } from "@/integrations/tmdb/tmdb.service";

import { KobisMovieImportService } from "./kobis-movie-import.service";
import { MoviesRepository } from "./repositories/movies.repository";
import { toKobisRankingSnapshotInput } from "./mappers/kobis-ranking.mapper";
import { TmdbMovieSyncService } from "./tmdb-movie-sync.service";

const getSeoulDate = (dayOffset = 0): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + dayOffset);

  return date.toISOString().slice(0, 10).replaceAll("-", "");
};

const toTmdbDate = (value?: string | null): string | null => {
  if (!value || !/^\d{8}$/.test(value)) {
    return null;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

@Injectable()
export class KobisMovieBatchImportService {
  private readonly logger = new Logger(KobisMovieBatchImportService.name);

  constructor(
    private readonly kobisService: KobisService,
    private readonly kobisMovieImportService: KobisMovieImportService,
    private readonly moviesRepository: MoviesRepository,
    private readonly tmdbService: TmdbService,
    private readonly tmdbMovieSyncService: TmdbMovieSyncService,
  ) {}

  async importMovies(
    productionStartYear: number,
    productionEndYear: number,
    pageCount = 2,
    limit = 20,
  ): Promise<string[]> {
    const movieIds = new Set<string>();

    for (let page = 1; page <= pageCount; page += 1) {
      const response = await this.kobisService.searchMoviesByProductionYear(
        productionStartYear,
        productionEndYear,
        page,
        limit,
      );

      for (const movie of response.results) {
        const movieId = await this.kobisMovieImportService.importMovie(
          movie.movieCd,
        );

        movieIds.add(movieId);
      }
    }

    return [...movieIds];
  }

  async importUpcomingMovies(limit = 100): Promise<string[]> {
    // 오늘 개봉작은 개봉 예정에서 제외하고, 내일부터 90일 뒤까지 조회함.
    const startDate = getSeoulDate(1);
    const endDate = getSeoulDate(90);
    const movieIds = new Set<string>();
    const firstPage = await this.kobisService.searchMoviesByReleaseDate(
      startDate.slice(0, 4),
      endDate.slice(0, 4),
      1,
      limit,
    );
    const totalPages = Math.min(Math.ceil(firstPage.totalCount / limit), 50);

    for (let page = 1; page <= totalPages; page += 1) {
      const response =
        page === 1
          ? firstPage
          : await this.kobisService.searchMoviesByReleaseDate(
              startDate.slice(0, 4),
              endDate.slice(0, 4),
              page,
              limit,
            );

      for (const movie of response.results) {
        const releaseDate = movie.releaseDate?.trim();

        if (
          movie.productionStatus?.trim() !== "개봉예정" ||
          !releaseDate ||
          releaseDate < startDate ||
          releaseDate > endDate
        ) {
          continue;
        }

        try {
          const tmdbMovie = await this.findTmdbMovie(
            movie.title,
            releaseDate,
          );
          const tmdbLinkedMovieId = tmdbMovie
            ? await this.moviesRepository.findMovieIdByProviderLink(
                SourceProvider.TMDB,
                String(tmdbMovie.id),
              )
            : null;

          const movieId = await this.kobisMovieImportService.importMovie(
            movie.movieCd,
            movie.title,
            tmdbLinkedMovieId ?? undefined,
          );

          if (tmdbMovie) {
            await this.tmdbMovieSyncService.syncMovieFromTmdb(
              movieId,
              tmdbMovie.id,
            );
          }

          movieIds.add(movieId);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);

          this.logger.warn(
            `KOBIS 개봉 예정 영화 저장을 건너뜀: ${movie.movieCd} ${movie.title} - ${message}`,
          );
        }
      }
    }

    return [...movieIds];
  }

  async importDailyBoxOffice(targetDt: string): Promise<string[]> {
    const movieIds: string[] = [];
    const collectedAt = new Date();

    const boxOffice = await this.kobisService.getDailyBoxOffice(targetDt);

    for (const movie of boxOffice.results) {
      const tmdbMovie = await this.findTmdbMovie(
        movie.movieNm,
        movie.openDt,
      );

      const tmdbLinkedMovieId = tmdbMovie
        ? await this.moviesRepository.findMovieIdByProviderLink(
            SourceProvider.TMDB,
            String(tmdbMovie.id),
          )
        : null;

      const movieId = await this.kobisMovieImportService.importMovie(
        movie.movieCd,
        movie.movieNm,
        tmdbLinkedMovieId ?? undefined,
      );

      if (tmdbMovie) {
        await this.tmdbMovieSyncService.syncMovieFromTmdb(
          movieId,
          tmdbMovie.id,
        );
      }

      const rankingInput = toKobisRankingSnapshotInput(
        movie,
        movieId,
        collectedAt,
      );

      await this.moviesRepository.saveMovieRankingSnapshot(rankingInput);

      movieIds.push(movieId);
    }

    return movieIds;
  }

  private async findTmdbMovie(
    title: string,
    releaseDate?: string | null,
  ) {
    let response;

    try {
      response = await this.tmdbService.searchMovies(title, 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(`TMDB 보완 조회 실패: ${title} - ${message}`);
      return null;
    }

    const normalizedTitle = title.trim().toLocaleLowerCase();
    const tmdbReleaseDate = toTmdbDate(releaseDate);

    return (
      response.results.find(
        (movie) =>
          movie.poster_path &&
          tmdbReleaseDate &&
          movie.release_date === tmdbReleaseDate,
      ) ??
      response.results.find(
        (movie) =>
          movie.poster_path &&
          movie.title.trim().toLocaleLowerCase() === normalizedTitle,
      ) ??
      null
    );
  }
}
