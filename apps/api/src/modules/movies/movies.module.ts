import { Module } from "@nestjs/common";

import { KobisModule } from "@/integrations/kobis/kobis.module";

import { MoviesController } from "./movies.controller";
import { MoviesRepository } from "./movies.repository";
import { MoviesService } from "./movies.service";
import { MovieMatcherService } from "./movie-matcher.service";
import { KobisMovieImportService } from "./kobis-movie-import.service";

@Module({
  imports: [KobisModule],
  controllers: [MoviesController],
  providers: [
    MoviesRepository,
    MoviesService,
    MovieMatcherService,
    KobisMovieImportService,
  ],
  exports: [MoviesService, MovieMatcherService, KobisMovieImportService],
})
export class MoviesModule {}
