import {Logger} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";

import {BatchAppModule} from "@/batch-app.module";
import {KobisMovieBatchImportService} from "@/modules/movies/kobis-movie-batch-import.service";

const getCurrentSeoulYear = (): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());

  return Number(parts.find((part) => part.type === "year")?.value);
};

const logger = new Logger("MovieReleasedSync");

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BatchAppModule);

  try {
    const kobisMovieBatchImportService = app.get(
      KobisMovieBatchImportService,
    );
    const releaseYear = getCurrentSeoulYear();
    const result = await kobisMovieBatchImportService.importReleasedMovies(
      releaseYear,
      100,
    );

    logger.log(
      `올해 개봉 영화 동기화 완료: ${releaseYear}년, ` +
        `조회 ${result.fetched}개, 저장 ${result.imported}개, ` +
        `실패 ${result.failed}개`,
    );

    if (result.failed > 0) {
      logger.warn(JSON.stringify(result.failures));
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error(`[FATAL] ${message}`, stack);
    process.exit(1);
  });
