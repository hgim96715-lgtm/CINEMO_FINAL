import { Injectable } from "@nestjs/common";

import { TmdbService } from "@/integrations/tmdb/tmdb.service";

import { toCreateMovieFromTmdbInput } from "./mappers/tmdb-movie-import.mapper";
import { MoviesRepository } from "./movies.repository";
import { TmdbMovieEnrichmentService } from "./tmdb-movie-enrichment.service";

@Injectable()
export class TmdbMovieBatchImportService {
  constructor(
    private readonly tmdbService: TmdbService,
    private readonly moviesRepository: MoviesRepository,
    private readonly tmdbMovieEnrichmentService: TmdbMovieEnrichmentService,
  ) {}

  async importPopularMovies(pageCount = 2): Promise<string[]> {
    const movieIds = new Set<string>();

    for (let page = 1; page <= pageCount; page += 1) {
      const response = await this.tmdbService.getPopularMovies(page);

      for (const movie of response.results) {
        const movieId =
          await this.moviesRepository.getOrCreateMovieByProviderLink(
            toCreateMovieFromTmdbInput(movie),
          );

        await this.tmdbMovieEnrichmentService.enrichMovie(movieId, movie.id);

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
        const movieId =
          await this.moviesRepository.getOrCreateMovieByProviderLink(
            toCreateMovieFromTmdbInput(movie),
          );

        await this.tmdbMovieEnrichmentService.enrichMovie(movieId, movie.id);

        movieIds.add(movieId);
      }
    }

    return [...movieIds];
  }
}
