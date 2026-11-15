import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CinemaVisitController } from "./controllers/cinema-visit.controller";
import { CinemaVisitService } from "./services/cinema-visit.service";
import { CinemaVisitRepository } from "./repositories/cinema-visit.repository";
import { ActivityModule } from "@/modules/activity/activity.module";

@Module({
  imports: [PrismaModule, ActivityModule],
  controllers: [CinemaVisitController],
  providers: [CinemaVisitService, CinemaVisitRepository],
  exports: [CinemaVisitService],
})
export class CinemaPassportModule {}
