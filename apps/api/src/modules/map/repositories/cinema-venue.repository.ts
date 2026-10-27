import { MapProvider, Prisma, VenueType } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export type UpsertVenueInput = {
  type: VenueType;
  provider: MapProvider;
  externalId: string;
  name: string;
  brandName: string | null;

  region1Code: string;
  region1Name: string;
  region2Code: string | null;
  region2Name: string | null;
  region3Code: string | null;
  region3Name: string | null;

  hCode: string | null;
  bCode: string | null;

  roadAddress: string | null;
  jibunAddress: string | null;
  latitude: Prisma.Decimal | number | string;
  longitude: Prisma.Decimal | number | string;

  phone: string | null;
  placeUrl: string | null;
};

export type UpsertManyCinemasResult = {
  total: number;
  created: number;
  updated: number;
};

@Injectable()
export class VenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProviderAndExternalId(provider: MapProvider, externalId: string) {
    return this.prisma.venue.findUnique({
      where: {
        provider_externalId: {
          provider,
          externalId,
        },
      },
    });
  }

  upsert(input: UpsertVenueInput) {
    const { provider, externalId, ...data } = input;
    return this.prisma.venue.upsert({
      where: {
        provider_externalId: {
          provider,
          externalId,
        },
      },
      create: {
        provider,
        externalId,
        ...data,
        isActive: true,
      },
      update: {
        ...data,
        isActive: true,
        checkedAt: new Date(),
      },
    });
  }
  findCinemaByRegion(params: {
    region1Code?: string;
    region2Code?: string;
    region3Code?: string;
  }) {
    const where: Prisma.VenueWhereInput = {
      type: VenueType.CINEMA,
      isActive: true,
      ...(params.region1Code !== undefined && {
        region1Code: params.region1Code,
      }),
      ...(params.region2Code !== undefined && {
        region2Code: params.region2Code,
      }),
      ...(params.region3Code !== undefined && {
        region3Code: params.region3Code,
      }),
    };
    return this.prisma.venue.findMany({
      where,
      orderBy: [
        { region1Name: "asc" },
        { region2Name: "asc" },
        { region3Name: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        brandName: true,
        region1Code: true,
        region1Name: true,
        region2Code: true,
        region2Name: true,
        region3Code: true,
        region3Name: true,
        roadAddress: true,
        latitude: true,
        longitude: true,
        phone: true,
        placeUrl: true,
      },
    });
  }

  async upsertManyCinemas(
    inputs: readonly UpsertVenueInput[],
    checkedAt = new Date(),
  ): Promise<UpsertManyCinemasResult> {
    const uniqueInputs = Array.from(
      new Map(
        inputs.map((input) => [`${input.provider}:${input.externalId}`, input]),
      ).values(),
    );

    return await this.prisma.$transaction(
      async (tx) => {
        let created = 0;
        let updated = 0;

        for (const input of uniqueInputs) {
          const { provider, externalId, ...data } = input;

          const existing = await tx.venue.findUnique({
            where: {
              provider_externalId: {
                provider,
                externalId,
              },
            },
            select: {
              id: true,
            },
          });

          await tx.venue.upsert({
            where: {
              provider_externalId: {
                provider,
                externalId,
              },
            },
            create: {
              provider,
              externalId,
              ...data,
              isActive: true,
              checkedAt,
            },
            update: {
              ...data,
              isActive: true,
              checkedAt,
            },
          });

          if (existing) {
            updated += 1;
          } else {
            created += 1;
          }
        }

        return {
          total: uniqueInputs.length,
          created,
          updated,
        };
      },
      {
        timeout: 120_000,
      },
    );
  }

  deactivateCinemasNotSeenSince(checkedAt: Date) {
    return this.prisma.venue.updateMany({
      where: {
        type: VenueType.CINEMA,
        provider: MapProvider.KAKAO,
        isActive: true,
        checkedAt: {
          lt: checkedAt,
        },
      },
      data: {
        isActive: false,
      },
    });
  }
}
