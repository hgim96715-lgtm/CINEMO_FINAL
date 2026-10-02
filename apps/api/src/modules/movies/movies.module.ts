import { Module } from "@nestjs/common";

import { KobisModule } from "@/integrations/kobis/kobis.module";

import { MoviesController } from "./movies.controller";
import { MoviesRepository } from "./movies.repository";
import { MoviesService } from "./movies.service";
import { MovieMatcherService } from "./movie-matcher.service";
import { KobisMovieImportService } from "./kobis-movie-import.service";
import { KobisMovieBatchImportService } from "./kobis-movie-batch-import.service";
import { TmdbModule } from "@/integrations/tmdb/tmdb.module";
import { TmdbMovieEnrichmentService } from "./tmdb-movie-enrichment.service";
import { MoviePersonService } from "./movie-person.service";
import { KmdbMovieEnrichmentService } from "./kmdb-movie-enrichment.service";
import { KmdbModule } from "@/integrations/kmdb/kmdb.module";
import { TmdbMovieBatchImportService } from "./tmdb-movie-batch-import.service";
import { MovieImportController } from "./movie-import.controller";

@Module({
  imports: [KobisModule, TmdbModule, KmdbModule],
  controllers: [MoviesController, MovieImportController],
  providers: [
    MoviesRepository,
    MoviesService,
    MovieMatcherService,
    KobisMovieImportService,
    KobisMovieBatchImportService,
    TmdbMovieEnrichmentService,
    TmdbMovieBatchImportService,
    KmdbMovieEnrichmentService,
    MoviePersonService,
  ],
  exports: [
    MoviesService,
    MovieMatcherService,
    KobisMovieImportService,
    KobisMovieBatchImportService,
    TmdbMovieEnrichmentService,
    TmdbMovieBatchImportService,
    KmdbMovieEnrichmentService,
    MoviePersonService,
  ],
})
export class MoviesModule {}
