import { Injectable } from "@nestjs/common";
import type { Prisma, TheaterExclusive } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

export type LinkedCinemaRecord = {
  chain: TheaterExclusive;
  externalCode: string;
  officialName: string | null;
  bookingUrl: string | null;
  venue: {
    id: string;
    name: string;
    roadAddress: string | null;
    jibunAddress: string | null;
    latitude: Prisma.Decimal | null;
    longitude: Prisma.Decimal | null;
  };
};

@Injectable()
export class CinemaShowtimesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLinkedCinemas(): Promise<LinkedCinemaRecord[]> {
    return this.prisma.cinemaChainVenue.findMany({
      where: {
        venue: {
          type: "CINEMA",
          isActive: true,
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      select: {
        chain: true,
        externalCode: true,
        officialName: true,
        bookingUrl: true,
        venue: {
          select: {
            id: true,
            name: true,
            roadAddress: true,
            jibunAddress: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
  }
}
