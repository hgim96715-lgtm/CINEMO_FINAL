import { ConflictException, Injectable } from "@nestjs/common";
import { SourceProvider } from "@prisma/client";

import { TmdbService } from "@/integrations/tmdb/tmdb.service";

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

  async importNowPlayingMovies(pageCount = 2): Promise<string[]> {
    const movieIds = new Set<string>();

    for (let page = 1; page <= pageCount; page += 1) {
      const response = await this.tmdbService.getNowPlayingMovies(page);

      for (const movie of response.results) {
        const movieId = await this.getOrCreateTmdbMovie(
          toCreateMovieFromTmdbInput(movie),
        );

        await this.tmdbMovieSyncService.syncMovieFromTmdb(movieId, movie.id);

        movieIds.add(movieId);
      }
    }

    return [...movieIds];
  }

  async importUpcomingMovies(pageCount = 2): Promise<string[]> {
    const movieIds = new Set<string>();

    for (let page = 1; page <= pageCount; page += 1) {
      const response = await this.tmdbService.getUpcomingMovies(page);

      for (const movie of response.results) {
        const movieId = await this.getOrCreateTmdbMovie(
          toCreateMovieFromTmdbInput(movie),
        );

        await this.tmdbMovieSyncService.syncMovieFromTmdb(movieId, movie.id);

        movieIds.add(movieId);
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
