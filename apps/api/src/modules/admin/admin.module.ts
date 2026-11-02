import { Module } from "@nestjs/common";

import { AdminController } from "./admin.controller";
import { AdminRepository } from "./admin.repository";
import { AdminService } from "./admin.service";
import { AdminGuard } from "./admin.guard";
import { CurationController } from "./curation.controller";
import { CurationRepository } from "./curation.repository";
import { CurationService } from "./curation.service";

@Module({
  controllers: [AdminController, CurationController],
  providers: [
    AdminRepository,
    AdminService,
    AdminGuard,
    CurationRepository,
    CurationService,
  ],
})
export class AdminModule {}
