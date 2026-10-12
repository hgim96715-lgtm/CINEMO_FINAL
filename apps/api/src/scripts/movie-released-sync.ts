import {Logger} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";

import {BatchAppModule} from "@/batch-app.module";
import {KobisMovieBatchImportService} from "@/modules/movies/kobis-movie-batch-import.service";

const formatDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
};

const getPreviousMonthDateRange = (): {
  startDate: string;
  endDate: string;
} => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const currentMonthStart = new Date(Date.UTC(year, month - 1, 1));
  const previousMonthStart = new Date(currentMonthStart);
  previousMonthStart.setUTCMonth(previousMonthStart.getUTCMonth() - 1);
  const previousMonthEnd = new Date(currentMonthStart);
  previousMonthEnd.setUTCDate(0);

  return {
    startDate: formatDateKey(previousMonthStart),
    endDate: formatDateKey(previousMonthEnd),
  };
};

const logger = new Logger("MovieReleasedSync");

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BatchAppModule);

  try {
    const kobisMovieBatchImportService = app.get(
      KobisMovieBatchImportService,
    );
    const {startDate, endDate} = getPreviousMonthDateRange();
    const result =
      await kobisMovieBatchImportService.importReleasedMoviesByDateRange(
        startDate,
        endDate,
        100,
      );

    logger.log(
      `전월 개봉 영화 동기화 완료: ${startDate}~${endDate}, ` +
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
