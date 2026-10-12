import {Logger} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";

import {BatchAppModule} from "@/batch-app.module";
import {MovieReleaseNotificationService} from "@/modules/movies/movie-release-notification.service";

const logger = new Logger("MovieReleaseNotificationSync");

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BatchAppModule);
  
  try {
    const service = app.get(MovieReleaseNotificationService);
    const result = await service.sendDueReleaseNotifications();
    
    logger.log(JSON.stringify(result));
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