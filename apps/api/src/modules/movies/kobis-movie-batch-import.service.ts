import { BadRequestException, Injectable, Logger } from "@nestjs/common";
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
            movie.productionYear,
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
            { releaseDate },
          );

          if (tmdbMovie) {
            await this.tmdbMovieSyncService.syncMovieFromTmdb(
              movieId,
              tmdbMovie.id,
            );
          }

          movieIds.add(movieId);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          this.logger.warn(
            `KOBIS 개봉 예정 영화 저장을 건너뜀: ${movie.movieCd} ${movie.title} - ${message}`,
          );
        }
      }
    }

    return [...movieIds];
  }

  async importReleasedMovies(
    releaseYear: number,
    limit = 100,
  ): Promise<{
    releaseYear: number;
    fetched: number;
    imported: number;
    skipped: number;
    failed: number;
    movieIds: string[];
    failures: Array<{ movieCd: string; title: string; message: string }>;
  }> {
    const year = String(releaseYear);
    const today = getSeoulDate();
    const movieIds = new Set<string>();
    const failures: Array<{
      movieCd: string;
      title: string;
      message: string;
    }> = [];
    let fetched = 0;
    let skipped = 0;

    const firstPage = await this.kobisService.searchMoviesByReleaseDate(
      year,
      year,
      1,
      limit,
    );
    const totalPages = Math.min(Math.ceil(firstPage.totalCount / limit), 100);

    for (let page = 1; page <= totalPages; page += 1) {
      const response =
        page === 1
          ? firstPage
          : await this.kobisService.searchMoviesByReleaseDate(
              year,
              year,
              page,
              limit,
            );

      for (const movie of response.results) {
        fetched += 1;
        const releaseDate = movie.releaseDate?.trim();

        if (
          !releaseDate ||
          !releaseDate.startsWith(year) ||
          releaseDate > today
        ) {
          skipped += 1;
          continue;
        }

        try {
          const tmdbMovie = await this.findTmdbMovie(
            movie.title,
            releaseDate,
            movie.productionYear,
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
            { releaseDate },
          );

          if (tmdbMovie) {
            await this.tmdbMovieSyncService.syncMovieFromTmdb(
              movieId,
              tmdbMovie.id,
            );
          }

          movieIds.add(movieId);
        } catch (error) {
          failures.push({
            movieCd: movie.movieCd,
            title: movie.title,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return {
      releaseYear,
      fetched,
      imported: movieIds.size,
      skipped,
      failed: failures.length,
      movieIds: [...movieIds],
      failures,
    };
  }

  async importDailyBoxOffice(targetDt: string): Promise<string[]> {
    const movieIds: string[] = [];
    const collectedAt = new Date();

    const boxOffice = await this.kobisService.getDailyBoxOffice(targetDt);

    for (const movie of boxOffice.results) {
      const tmdbMovie = await this.findTmdbMovie(movie.movieNm, movie.openDt);

      const tmdbLinkedMovieId = tmdbMovie
        ? await this.moviesRepository.findMovieIdByProviderLink(
            SourceProvider.TMDB,
            String(tmdbMovie.id),
          )
        : null;

      let movieId: string;

      try {
        movieId = await this.kobisMovieImportService.importMovie(
          movie.movieCd,
          movie.movieNm,
          tmdbLinkedMovieId ?? undefined,
          { releaseDate: movie.openDt },
        );
      } catch (error) {
        if (error instanceof BadRequestException) {
          this.logger.warn(
            `공개 목록에서 제외되는 영화를 건너뜀: ${movie.movieCd} ${movie.movieNm}`,
          );
          continue;
        }

        throw error;
      }

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

  async reconcileKobisReleases(): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    failures: Array<{ movieId: string; movieCd: string; message: string }>;
  }> {
    const links = await this.moviesRepository.findProviderLinks(
      SourceProvider.KOBIS,
    );
    const failures: Array<{
      movieId: string;
      movieCd: string;
      message: string;
    }> = [];
    let succeeded = 0;

    for (const link of links) {
      try {
        await this.kobisMovieImportService.importMovie(link.externalId);
        succeeded += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        failures.push({
          movieId: link.movieId,
          movieCd: link.externalId,
          message,
        });
        this.logger.warn(
          `KOBIS 개봉일 보정 실패: ${link.externalId} - ${message}`,
        );
      }
    }

    return {
      total: links.length,
      succeeded,
      failed: failures.length,
      failures,
    };
  }

  async auditProviderCollisions(): Promise<{
    inspected: number;
    splitCandidates: Array<{
      movieId: string;
      kobisMovieCd: string;
      tmdbMovieId: string;
      kobisTitle: string;
      tmdbTitle: string;
      kobisProductionYear: string | null;
      tmdbReleaseYear: number | null;
      kobisRuntime: number | null;
      tmdbRuntime: number | null;
      reason: string;
    }>;
    review: Array<{
      movieId: string;
      kobisMovieCd: string;
      tmdbMovieId: string;
      kobisTitle: string;
      tmdbTitle: string;
      kobisProductionYear: string | null;
      tmdbReleaseYear: number | null;
      kobisRuntime: number | null;
      tmdbRuntime: number | null;
      reason: string;
    }>;
    failures: Array<{ movieId: string; message: string }>;
  }> {
    const movies =
      await this.moviesRepository.findMoviesWithKobisAndTmdbLinks();
    const splitCandidates: Array<{
      movieId: string;
      kobisMovieCd: string;
      tmdbMovieId: string;
      kobisTitle: string;
      tmdbTitle: string;
      kobisProductionYear: string | null;
      tmdbReleaseYear: number | null;
      kobisRuntime: number | null;
      tmdbRuntime: number | null;
      reason: string;
    }> = [];
    const review: typeof splitCandidates = [];
    const failures: Array<{ movieId: string; message: string }> = [];

    for (const movie of movies) {
      const kobisLink = movie.providerLinks.find(
        (link) => link.sourceProvider === SourceProvider.KOBIS,
      );
      const tmdbLink = movie.providerLinks.find(
        (link) => link.sourceProvider === SourceProvider.TMDB,
      );

      if (!kobisLink || !tmdbLink) {
        continue;
      }

      try {
        const [kobisMovie, tmdbMovie] = await Promise.all([
          this.kobisService.getMovieInfo(kobisLink.externalId),
          this.tmdbService.getMovieDetail(Number(tmdbLink.externalId)),
        ]);
        const kobisYear = kobisMovie.productionYear?.trim() || null;
        const tmdbYear = tmdbMovie.release_date
          ? Number(tmdbMovie.release_date.slice(0, 4))
          : null;
        const yearConflict =
          kobisYear && tmdbYear
            ? Math.abs(Number(kobisYear) - tmdbYear) >= 2
            : false;
        const kobisYearIsNewer =
          kobisYear && tmdbYear ? Number(kobisYear) > tmdbYear : false;
        const runtimeConflict =
          kobisMovie.runningTime !== null &&
          kobisMovie.runningTime > 0 &&
          tmdbMovie.runtime !== null &&
          tmdbMovie.runtime > 0 &&
          Math.abs(kobisMovie.runningTime - tmdbMovie.runtime) >= 60;

        if (yearConflict || runtimeConflict) {
          const item = {
            movieId: movie.id,
            kobisMovieCd: kobisLink.externalId,
            tmdbMovieId: tmdbLink.externalId,
            kobisTitle: kobisMovie.title,
            tmdbTitle: tmdbMovie.title,
            kobisProductionYear: kobisYear,
            tmdbReleaseYear: tmdbYear,
            kobisRuntime: kobisMovie.runningTime,
            tmdbRuntime: tmdbMovie.runtime,
            reason: [
              yearConflict ? "제작연도 차이" : null,
              runtimeConflict ? "러닝타임 차이" : null,
            ]
              .filter(Boolean)
              .join(", "),
          };

          if (kobisYearIsNewer || runtimeConflict) {
            splitCandidates.push(item);
          } else {
            review.push(item);
          }
        }
      } catch (error) {
        failures.push({
          movieId: movie.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { inspected: movies.length, splitCandidates, review, failures };
  }

  async splitProviderCollisions(): Promise<{
    inspected: number;
    split: Array<{
      oldMovieId: string;
      newMovieId: string;
      kobisMovieCd: string;
      tmdbMovieId: string;
    }>;
    review: Awaited<
      ReturnType<KobisMovieBatchImportService["auditProviderCollisions"]>
    >["review"];
    failures: Array<{ movieId: string; message: string }>;
  }> {
    const audit = await this.auditProviderCollisions();
    const split: Array<{
      oldMovieId: string;
      newMovieId: string;
      kobisMovieCd: string;
      tmdbMovieId: string;
    }> = [];
    const failures = [...audit.failures];

    for (const candidate of audit.splitCandidates) {
      try {
        const result = await this.splitProviderCollision(
          candidate.movieId,
          candidate.tmdbMovieId,
          candidate.kobisMovieCd,
        );
        split.push({
          oldMovieId: candidate.movieId,
          newMovieId: result.newMovieId,
          kobisMovieCd: candidate.kobisMovieCd,
          tmdbMovieId: candidate.tmdbMovieId,
        });
      } catch (error) {
        failures.push({
          movieId: candidate.movieId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      inspected: audit.inspected,
      split,
      review: audit.review,
      failures,
    };
  }

  async splitProviderCollision(
    movieId: string,
    tmdbMovieId: string,
    kobisMovieCd?: string,
  ): Promise<{
    oldMovieId: string;
    newMovieId: string;
    kobisMovieCd: string;
    tmdbMovieId: string;
  }> {
    const links = await this.moviesRepository.findApprovedProviderLinksForMovie(
      movieId,
    );
    const kobisLink = links.find(
      (link) => link.sourceProvider === SourceProvider.KOBIS,
    );
    const tmdbLink = links.find(
      (link) =>
        link.sourceProvider === SourceProvider.TMDB &&
        link.externalId === tmdbMovieId,
    );

    if (!kobisLink) {
      throw new BadRequestException(
        "분리 대상 영화에 승인된 KOBIS 연결이 없습니다.",
      );
    }

    if (!tmdbLink) {
      const separatedMovieId =
        await this.moviesRepository.findMovieIdByProviderLink(
          SourceProvider.TMDB,
          tmdbMovieId,
        );

      if (separatedMovieId && separatedMovieId !== movieId) {
        await this.moviesRepository.deleteKoreanWatchOptions(movieId);

        return {
          oldMovieId: movieId,
          newMovieId: separatedMovieId,
          kobisMovieCd: kobisLink.externalId,
          tmdbMovieId,
        };
      }

      throw new BadRequestException(
        "분리 대상 TMDB 연결을 찾을 수 없습니다.",
      );
    }

    const newMovieId = await this.moviesRepository.splitTmdbLinkToNewMovie(
      movieId,
      tmdbMovieId,
    );
    await this.tmdbMovieSyncService.syncMovieFromTmdb(
      newMovieId,
      Number(tmdbMovieId),
    );
    await this.kobisMovieImportService.importMovie(
      kobisMovieCd ?? kobisLink.externalId,
    );

    return {
      oldMovieId: movieId,
      newMovieId,
      kobisMovieCd: kobisMovieCd ?? kobisLink.externalId,
      tmdbMovieId,
    };
  }

  private async findTmdbMovie(
    title: string,
    releaseDate?: string | null,
    productionYear?: string | null,
  ) {
    let response;

    try {
      response = await this.tmdbService.searchMovies(title, 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(`TMDB 보완 조회 실패: ${title} - ${message}`);
      return null;
    }

    const normalizeTitle = (value: string) =>
      value
        .trim()
        .toLocaleLowerCase()
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N}]+/gu, "");

    const normalizedTitle = normalizeTitle(title);
    const tmdbReleaseDate = toTmdbDate(releaseDate);
    const normalizedProductionYear = productionYear?.trim();

    const titleMatches = response.results.filter((movie) => {
      const movieTitle = normalizeTitle(movie.title);
      const originalTitle = normalizeTitle(movie.original_title);

      return (
        movie.poster_path &&
        (movieTitle === normalizedTitle || originalTitle === normalizedTitle)
      );
    });

    if (titleMatches.length === 0) {
      return null;
    }

    const yearMatchedTitles = normalizedProductionYear
      ? titleMatches.filter((movie) => {
          const tmdbYear = movie.release_date?.slice(0, 4);

          // 제목이 같은 리메이크·원작을 잘못 연결하지 않도록
          // KOBIS 제작연도와 TMDB 개봉연도가 정확히 같은 후보만 자동 매칭함.
          return tmdbYear === normalizedProductionYear;
        })
      : titleMatches;

    if (yearMatchedTitles.length === 0) {
      return null;
    }

    if (tmdbReleaseDate) {
      const exactDateMatch = yearMatchedTitles.find(
        (movie) => movie.release_date === tmdbReleaseDate,
      );

      if (exactDateMatch) {
        return exactDateMatch;
      }

      const targetTime = Date.parse(`${tmdbReleaseDate}T00:00:00.000Z`);

      const nearbyMatch = yearMatchedTitles
        .filter((movie) => movie.release_date)
        .map((movie) => ({
          movie,
          distance: Math.abs(
            Date.parse(`${movie.release_date}T00:00:00.000Z`) - targetTime,
          ),
        }))
        .filter(({ distance }) => distance <= 365 * 24 * 60 * 60 * 1000)
        .sort((a, b) => a.distance - b.distance)[0];

      return nearbyMatch?.movie ?? null;
    }

    // 개봉일을 확인할 수 없을 때 제목만으로 자동 연결하면
    // 같은 제목의 리메이크·재개봉 작품을 잘못 연결할 수 있음.
    return null;
  }
}
