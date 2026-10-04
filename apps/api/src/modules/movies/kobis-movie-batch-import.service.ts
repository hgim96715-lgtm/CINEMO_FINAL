import { Injectable } from "@nestjs/common";
import { SourceProvider } from "@prisma/client";

import { KobisService } from "@/integrations/kobis/kobis.service";
import { TmdbService } from "@/integrations/tmdb/tmdb.service";

import { KobisMovieImportService } from "./kobis-movie-import.service";
import { MoviesRepository } from "./movies.repository";
import { toKobisRankingSnapshotInput } from "./mappers/kobis-ranking.mapper";
import { TmdbMovieEnrichmentService } from "./tmdb-movie-enrichment.service";

@Injectable()
export class KobisMovieBatchImportService {
  constructor(
    private readonly kobisService: KobisService,
    private readonly kobisMovieImportService: KobisMovieImportService,
    private readonly moviesRepository: MoviesRepository,
    private readonly tmdbService: TmdbService,
    private readonly tmdbMovieEnrichmentService: TmdbMovieEnrichmentService,
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
        await this.tmdbMovieEnrichmentService.enrichMovie(
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
    const response = await this.tmdbService.searchMovies(title, 1);
    const normalizedTitle = title.trim().toLocaleLowerCase();

    return (
      response.results.find(
        (movie) =>
          movie.poster_path &&
          releaseDate &&
          movie.release_date === releaseDate,
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
