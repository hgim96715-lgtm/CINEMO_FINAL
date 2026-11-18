import { Injectable } from "@nestjs/common";
import { TheaterExclusive } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

export type UpsertCinemaChainVenueInput = {
  venueId: string;
  chain: TheaterExclusive;
  externalCode: string;
  officialName?: string | null;
  bookingUrl?: string | null;
};

@Injectable()
export class CinemaChainVenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(input: UpsertCinemaChainVenueInput) {
    const { venueId, chain, ...data } = input;

    return this.prisma.cinemaChainVenue.upsert({
      where: { venueId_chain: { venueId, chain } },
      create: { venueId, chain, ...data },
      update: { ...data, checkedAt: new Date() },
    });
  }

  findByVenueIds(venueIds: readonly string[]) {
    if (venueIds.length === 0) return [];

    return this.prisma.cinemaChainVenue.findMany({
      where: { venueId: { in: [...venueIds] } },
      orderBy: [{ chain: "asc" }, { officialName: "asc" }],
    });
  }
}
