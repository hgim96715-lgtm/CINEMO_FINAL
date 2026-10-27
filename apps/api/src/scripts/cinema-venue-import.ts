import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { CinemaBatchAppModule } from "@/cinema-batch-app.module";
import { CinemaVenueImportService } from "@/modules/map/cinema-venue-import.service";

const logger = new Logger("CinemaVenueImport");

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CinemaBatchAppModule);

  try {
    const importService = app.get(CinemaVenueImportService);
    const result = await importService.collectAndSave();

    logger.log(
      [
        "전국 영화관 수집 완료",
        `검색 지역: ${result.searchQueryCount}개`,
        `발견 장소: ${result.foundPlaceCount}개`,
        `신규 저장: ${result.created}개`,
        `갱신: ${result.updated}개`,
        `비활성화: ${result.deactivatedPlaceCount}개`,
        `건너뜀: ${result.skippedPlaceCount}개`,
      ].join(" / "),
    );
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
