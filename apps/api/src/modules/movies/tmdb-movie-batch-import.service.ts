import { ConflictException, Injectable } from "@nestjs/common";
import { SourceProvider } from "@prisma/client";

import {
  TmdbService,
  TmdbUpcomingMovieDateRange,
} from "@/integrations/tmdb/tmdb.service";

import { toCreateMovieFromTmdbInput } from "./mappers/tmdb-movie-import.mapper";
import { MoviesRepository } from "./repositories/movies.repository";
import { MovieMatcherService } from "./movie-matcher.service";
import { TmdbMovieSyncService } from "./tmdb-movie-sync.service";

const TMDB_SYNC_CONCURRENCY = 3;

@Injectable()
export class TmdbMovieBatchImportService {
  constructor(
    private readonly tmdbService: TmdbService,
    private readonly moviesRepository: MoviesRepository,
    private readonly movieMatcher: MovieMatcherService,
    private readonly tmdbMovieSyncService: TmdbMovieSyncService,
  ) {}

  private async getOrCreateTmdbMovie(
    input: Parameters<MoviesRepository["getOrCreateMovieByProviderLink"]>[0],
  ): Promise<string> {
    const candidates = await this.movieMatcher.findCandidates(
      input.title,
      input.releaseDate,
    );

    const matchedCandidate =
      candidates.find((candidate) =>
        candidate.providerLinks.some(
          (link) => link.sourceProvider === SourceProvider.KOBIS,
        ),
      ) ?? (candidates.length === 1 ? candidates[0] : undefined);

    if (!matchedCandidate && candidates.length > 1) {
      throw new ConflictException({
        code: "MOVIE_MATCH_REVIEW_REQUIRED",
        message: "동일한 영화 후보가 여러 개라 관리자 검토가 필요합니다.",
        candidateMovieIds: candidates.map((candidate) => candidate.id),
      });
    }

    return this.moviesRepository.getOrCreateMovieByProviderLink(
      input,
      matchedCandidate?.id,
    );
  }

  private getUpcomingMonthRanges(
    monthCount: number,
  ): TmdbUpcomingMovieDateRange[] {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    const day = Number(parts.find((part) => part.type === "day")?.value);
    const today = new Date(Date.UTC(year, month - 1, day));

    return Array.from({ length: monthCount }, (_, index) => {
      const start = new Date(today);
      start.setUTCDate(index === 0 ? today.getUTCDate() : 1);
      start.setUTCMonth(today.getUTCMonth() + index);

      const end = new Date(today);
      end.setUTCDate(1);
      end.setUTCMonth(today.getUTCMonth() + index + 1);
      end.setUTCDate(0);

      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      };
    });
  }

  private async mapWithConcurrency<T, R>(
    items: T[],
    worker: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    let nextIndex = 0;

    const runWorker = async () => {
      while (true) {
        const index = nextIndex++;

        if (index >= items.length) {
          return;
        }

        results[index] = await worker(items[index], index);
      }
    };

    const workerCount = Math.min(TMDB_SYNC_CONCURRENCY, items.length);

    await Promise.all(
      Array.from({ length: workerCount }, () => runWorker()),
    );

    return results;
  }

  async importPopularMovies(pageCount = 2): Promise<string[]> {
    const movieIds = new Set<string>();
    const collectedAt = new Date();

    for (let page = 1; page <= pageCount; page += 1) {
      const response = await this.tmdbService.getPopularMovies(page);

      const pageMovieIds = await this.mapWithConcurrency(
        response.results,
        async (movie, index) => {
          const movieId = await this.getOrCreateTmdbMovie(
            toCreateMovieFromTmdbInput(movie),
          );

          await this.tmdbMovieSyncService.syncMovieFromTmdb(movieId, movie.id);

          await this.moviesRepository.saveMoviePopularitySnapshot({
            movieId,
            rank: (page - 1) * 20 + index + 1,
            collectedAt,
          });

          return movieId;
        },
      );

      pageMovieIds.forEach((movieId) => movieIds.add(movieId));
    }

    return [...movieIds];
  }

  async importUpcomingMovies(pageCount = 2): Promise<string[]> {
    const movieIds = new Set<string>();
    const monthRanges = this.getUpcomingMonthRanges(3);

    for (const monthRange of monthRanges) {
      for (let page = 1; page <= pageCount; page += 1) {
        const response = await this.tmdbService.getUpcomingMovies(
          page,
          monthRange,
        );

        const pageMovieIds = await this.mapWithConcurrency(
          response.results,
          async (movie) => {
            const movieId = await this.getOrCreateTmdbMovie(
              toCreateMovieFromTmdbInput(movie),
            );

            await this.tmdbMovieSyncService.syncMovieFromTmdb(
              movieId,
              movie.id,
            );

            return movieId;
          },
        );

        pageMovieIds.forEach((movieId) => movieIds.add(movieId));
      }
    }

    return [...movieIds];
  }

  async syncMissingPosters(limit = 100) {
    const movies = await this.moviesRepository.findMoviesMissingPosters(limit);
    const updated: Array<{ movieId: string; title: string }> = [];
    const skipped: Array<{
      movieId: string;
      title: string;
      reason: "TMDB_POSTER_NOT_FOUND";
    }> = [];
    const review: Array<{
      movieId: string;
      title: string;
      reason: "TMDB_LINK_NOT_FOUND";
    }> = [];
    const failures: Array<{
      movieId: string;
      title: string;
      message: string;
    }> = [];

    await this.mapWithConcurrency(movies, async (movie) => {
      const title = movie.titles[0]?.title ?? "제목 없음";
      const tmdbMovieId = movie.providerLinks[0]?.externalId;

      if (!tmdbMovieId) {
        review.push({
          movieId: movie.id,
          title,
          reason: "TMDB_LINK_NOT_FOUND",
        });
        return movie.id;
      }

      try {
        const tmdbMovie = await this.tmdbService.getMovieDetail(
          Number(tmdbMovieId),
        );

        if (!tmdbMovie.poster_path) {
          skipped.push({
            movieId: movie.id,
            title,
            reason: "TMDB_POSTER_NOT_FOUND",
          });
          return movie.id;
        }

        await this.moviesRepository.upsertTmdbPoster(
          movie.id,
          tmdbMovie.poster_path,
        );
        updated.push({ movieId: movie.id, title });
      } catch (error) {
        failures.push({
          movieId: movie.id,
          title,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      return movie.id;
    });

    return {
      inspected: movies.length,
      updated: updated.length,
      skipped,
      review,
      failures,
    };
  }

  async importMovie(tmdbMovieId: number): Promise<string> {
    const tmdbMovie = await this.tmdbService.getMovieDetail(tmdbMovieId);
    const movieId = await this.getOrCreateTmdbMovie(
      toCreateMovieFromTmdbInput({
        ...tmdbMovie,
        genre_ids: [],
      }),
    );
    await this.tmdbMovieSyncService.syncMovieFromTmdb(movieId, tmdbMovieId);
    return movieId;
  }
}
