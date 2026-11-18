import { Module } from "@nestjs/common";

import { PrismaModule } from "@/prisma/prisma.module";
import { CinemaShowtimesController } from "./controllers/cinema-showtimes.controller";
import { CinemaShowtimesRepository } from "./repositories/cinema-showtimes.repository";
import { CinemaShowtimesService } from "./services/cinema-showtimes.service";
import { PoliteCinemaShowtimeClient } from "@/integrations/cinema-showtime/polite-cinema-showtime.client";

@Module({
  imports: [PrismaModule],
  controllers: [CinemaShowtimesController],
  providers: [
    CinemaShowtimesRepository,
    CinemaShowtimesService,
    PoliteCinemaShowtimeClient,
  ],
})
export class CinemaShowtimesModule {}
