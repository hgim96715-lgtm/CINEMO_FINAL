import { ConflictException, Injectable } from "@nestjs/common";
import { SourceProvider } from "@prisma/client";

import {
  TmdbService,
  TmdbUpcomingMovieDateRange,
} from "@/integrations/tmdb/tmdb.service";

import { toCreateMovieFromTmdbInput } from "./mappers/tmdb-movie-import.mapper";
import { MoviesRepository } from "./movies.repository";
import { MovieMatcherService } from "./movie-matcher.service";
import { TmdbMovieSyncService } from "./tmdb-movie-sync.service";

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

  async importPopularMovies(pageCount = 2): Promise<string[]> {
    const movieIds = new Set<string>();
    const collectedAt = new Date();

    for (let page = 1; page <= pageCount; page += 1) {
      const response = await this.tmdbService.getPopularMovies(page);

      for (const [index, movie] of response.results.entries()) {
        const movieId = await this.getOrCreateTmdbMovie(
          toCreateMovieFromTmdbInput(movie),
        );

        await this.tmdbMovieSyncService.syncMovieFromTmdb(movieId, movie.id);

        await this.moviesRepository.saveMoviePopularitySnapshot({
          movieId,
          rank: (page - 1) * 20 + index + 1,
          collectedAt,
        });

        movieIds.add(movieId);
      }
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

        for (const movie of response.results) {
          const movieId = await this.getOrCreateTmdbMovie(
            toCreateMovieFromTmdbInput(movie),
          );

          await this.tmdbMovieSyncService.syncMovieFromTmdb(movieId, movie.id);

          movieIds.add(movieId);
        }
      }
    }

    return [...movieIds];
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
