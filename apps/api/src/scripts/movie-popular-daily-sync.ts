import {Logger} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";

import {BatchAppModule} from "@/batch-app.module";
import {TmdbMovieBatchImportService} from "@/modules/movies/tmdb-movie-batch-import.service";

const logger = new Logger("MoviePopularDailySync");

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BatchAppModule);

  try {
    const service = app.get(TmdbMovieBatchImportService);
    const movieIds = await service.importPopularMovies(2);

    logger.log(`일일 인기 영화 동기화 완료: ${movieIds.length}개`);
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error(`[FATAL] ${message}`, stack);
    process.exit(1);
  });
