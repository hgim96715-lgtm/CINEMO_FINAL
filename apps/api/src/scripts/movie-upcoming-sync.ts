import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { BatchAppModule } from "@/batch-app.module";
import { MovieUpcomingSyncService } from "@/modules/movies/movie-upcoming-sync.service";

const logger = new Logger("MovieUpcomingSync");

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BatchAppModule);

  try {
    const movieUpcomingSyncService = app.get(MovieUpcomingSyncService);

    await movieUpcomingSyncService.run();
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error(`[FATAL] ${message}`, stack);
    process.exit(1);
  });
