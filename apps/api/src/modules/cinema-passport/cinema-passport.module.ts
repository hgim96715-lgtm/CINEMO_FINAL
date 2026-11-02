import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CinemaVisitController } from "./cinema-visit.controller";
import { CinemaVisitService } from "./cinema-visit.service";
import { CinemaVisitRepository } from "./repositories/cinema-visit.repository";
import { ActivityModule } from "@/modules/activity/activity.module";

@Module({
  imports: [PrismaModule, ActivityModule],
  controllers: [CinemaVisitController],
  providers: [CinemaVisitService, CinemaVisitRepository],
  exports: [CinemaVisitService],
})
export class CinemaPassportModule {}
