import { DailyMoviesModule } from "@/modules/daily-movies/daily-movies.module";
import { Module } from "@nestjs/common";

import { AdminController } from "./admin.controller";
import { AdminRepository } from "./admin.repository";
import { AdminService } from "./admin.service";
import { AdminGuard } from "./admin.guard";
import { CurationController } from "./curation.controller";
import { CurationRepository } from "./curation.repository";
import { CurationService } from "./curation.service";

import { PostcardReportsController } from "./postcard-reports.controller";
import { ServiceVisitsController } from "./service-visits.controller";
import { ServiceVisitsRepository } from "./service-visits.repository";
import { ServiceVisitsService } from "./service-visits.service";

@Module({
  imports: [DailyMoviesModule],
  controllers: [AdminController, CurationController, ServiceVisitsController, PostcardReportsController],
  providers: [
    AdminRepository,
    ServiceVisitsRepository,
    ServiceVisitsService,
    AdminService,
    AdminGuard,
    CurationRepository,
    CurationService,
  ],
})
export class AdminModule {}
