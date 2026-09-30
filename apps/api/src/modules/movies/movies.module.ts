import { Module } from "@nestjs/common";

import { KobisModule } from "@/integrations/kobis/kobis.module";

import { MoviesController } from "./movies.controller";
import { MoviesRepository } from "./movies.repository";
import { MoviesService } from "./movies.service";
import { MovieMatcherService } from "./movie-matcher.service";
import { KobisMovieImportService } from "./kobis-movie-import.service";
import { TmdbModule } from "@/integrations/tmdb/tmdb.module";
import { TmdbMovieEnrichmentService } from "./tmdb-movie-enrichment.service";

@Module({
  imports: [KobisModule, TmdbModule],
  controllers: [MoviesController],
  providers: [
    MoviesRepository,
    MoviesService,
    MovieMatcherService,
    KobisMovieImportService,
    TmdbMovieEnrichmentService,
  ],
  exports: [
    MoviesService,
    MovieMatcherService,
    KobisMovieImportService,
    TmdbMovieEnrichmentService,
  ],
})
export class MoviesModule {}
