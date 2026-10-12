import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { BatchAppModule } from "@/batch-app.module";
import { MoviePersonEnrichmentService } from "@/modules/movies/movie-person-enrichment.service";

const logger = new Logger("MoviePersonEnrichmentSync");

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BatchAppModule);

  try {
    const limit = Number(process.argv[2] ?? 100);
    const service = app.get(MoviePersonEnrichmentService);
    const result = await service.run(Number.isInteger(limit) ? limit : 100);

    logger.log(JSON.stringify(result));
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
