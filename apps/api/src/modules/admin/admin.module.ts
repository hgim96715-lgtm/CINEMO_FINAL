import { DailyMoviesModule } from "@/modules/daily-movies/daily-movies.module";
import { Module } from "@nestjs/common";

import { AdminController } from "./controllers/admin.controller";
import { CurationController } from "./controllers/curation.controller";
import { PostcardReportsController } from "./controllers/postcard-reports.controller";
import { ServiceEventsController } from "./controllers/service-events.controller";
import { ServiceVisitsController } from "./controllers/service-visits.controller";
import { AdminGuard } from "./guards/admin.guard";

import { AdminRepository } from "./repositories/admin.repository";
import { CurationRepository } from "./repositories/curation.repository";
import { PostcardReportsRepository } from "./repositories/postcard-reports.repository";
import { ServiceEventsRepository } from "./repositories/service-events.repository";
import { ServiceVisitsRepository } from "./repositories/service-visits.repository";
import { AdminService } from "./services/admin.service";
import { CurationService } from "./services/curation.service";
import { PostcardReportsService } from "./services/postcard-reports.service";
import { ServiceEventsService } from "./services/service-events.service";
import { ServiceVisitsService } from "./services/service-visits.service";

@Module({
  imports: [DailyMoviesModule],
  controllers: [
    AdminController,
    CurationController,
    ServiceVisitsController,
    ServiceEventsController,
    PostcardReportsController,
  ],
  providers: [
    AdminRepository,
    ServiceVisitsRepository,
    ServiceVisitsService,
    ServiceEventsRepository,
    ServiceEventsService,
    AdminService,
    AdminGuard,
    CurationRepository,
    CurationService,
    PostcardReportsRepository,
    PostcardReportsService,
  ],
})
export class AdminModule {}
