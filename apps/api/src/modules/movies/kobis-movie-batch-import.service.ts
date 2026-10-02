import { Injectable } from "@nestjs/common";

import { KobisService } from "@/integrations/kobis/kobis.service";

import { KobisMovieImportService } from "./kobis-movie-import.service";

@Injectable()
export class KobisMovieBatchImportService {
  constructor(
    private readonly kobisService: KobisService,
    private readonly kobisMovieImportService: KobisMovieImportService,
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
}
