import { Module } from "@nestjs/common";

import { KobisModule } from "@/integrations/kobis/kobis.module";

import { MoviesController } from "./movies.controller";
import { MoviesRepository } from "./movies.repository";
import { MoviesService } from "./movies.service";
import { MovieMatcherService } from "./movie-matcher.service";
import { KobisMovieImportService } from "./kobis-movie-import.service";
import { TmdbModule } from "@/integrations/tmdb/tmdb.module";
import { TmdbMovieEnrichmentService } from "./tmdb-movie-enrichment.service";
import { MoviePersonService } from "./movie-person.service";
import { KmdbMovieEnrichmentService } from "./kmdb-movie-enrichment.service";
import { KmdbModule } from "@/integrations/kmdb/kmdb.module";

@Module({
  imports: [KobisModule, TmdbModule, KmdbModule],
  controllers: [MoviesController],
  providers: [
    MoviesRepository,
    MoviesService,
    MovieMatcherService,
    KobisMovieImportService,
    TmdbMovieEnrichmentService,
    KmdbMovieEnrichmentService,
    MoviePersonService,
  ],
  exports: [
    MoviesService,
    MovieMatcherService,
    KobisMovieImportService,
    TmdbMovieEnrichmentService,
    KmdbMovieEnrichmentService,
    MoviePersonService,
  ],
})
export class MoviesModule {}
