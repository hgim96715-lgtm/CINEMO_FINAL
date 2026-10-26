import { Injectable } from "@nestjs/common";
import { MediaStatus, MediaType, Prisma } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

const personDetailArgs = Prisma.validator<Prisma.MoviePersonDefaultArgs>()({
  include: {
    credits: {
      orderBy: [{ creditType: "asc" }, { displayOrder: "asc" }],
      include: {
        movie: {
          include: {
            titles: true,
            releases: {
              where: {
                isPrimary: true,
              },
              take: 1,
            },
            media: {
              where: {
                mediaType: MediaType.POSTER,
                status: MediaStatus.ACTIVE,
              },
              orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
              take: 1,
            },
          },
        },
      },
    },
    providerLinks: {
      where: {
        sourceProvider: "TMDB",
      },
      take: 1,
    },
  },
});

export type PersonWithDetails = Prisma.MoviePersonGetPayload<
  typeof personDetailArgs
>;

@Injectable()
export class PeopleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(personId: string) {
    return this.prisma.moviePerson.findUnique({
      where: {
        id: personId,
      },
      ...personDetailArgs,
    });
  }
}
