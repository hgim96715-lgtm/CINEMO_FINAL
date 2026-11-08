import { Module } from "@nestjs/common";

import { MoviesModule } from "@/modules/movies/movies.module";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { DailyMoviesController } from "./daily-movies.controller";
import { DailyMoviesService } from "./daily-movies.service";

@Module({
  imports: [MoviesModule, NotificationsModule],
  controllers: [DailyMoviesController],
  providers: [DailyMoviesService],
  exports: [DailyMoviesService],
})
export class DailyMoviesModule {}
