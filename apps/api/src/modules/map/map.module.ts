import { Module } from "@nestjs/common";

import { KakaoModule } from "@/integrations/kakao/kakao.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { MapController } from "./controllers/map.controller";
import { MapService } from "./services/map.service";
import { VenueRepository } from "./repositories/cinema-venue.repository";
import { CinemaVenueImportService } from "./services/cinema-venue-import.service";

@Module({
  imports: [PrismaModule, KakaoModule],
  controllers: [MapController],
  providers: [MapService, VenueRepository, CinemaVenueImportService],
  exports: [MapService, CinemaVenueImportService],
})
export class MapModule {}
