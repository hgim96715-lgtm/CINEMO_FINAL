import { Injectable } from "@nestjs/common";
import { MediaStatus, MediaType, Prisma } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

const personDetailArgs = Prisma.validator<Prisma.MoviePersonDefaultArgs>()({
  select: {
    id: true,
    name: true,
    nameEn: true,
    profileUrl: true,
    biography: true,
    birthDate: true,
    birthPlace: true,
    nationality: true,
    credits: {
      orderBy: [{ creditType: "asc" }, { displayOrder: "asc" }],
      select: {
        id: true,
        personId: true,
        creditType: true,
        characterName: true,
        displayOrder: true,
        movie: {
          select: {
            id: true,
            titles: {
              select: {
                title: true,
                titleType: true,
              },
            },
            releases: {
              where: {
                isPrimary: true,
              },
              take: 1,
              select: {
                releaseDate: true,
              },
            },
            media: {
              where: {
                mediaType: MediaType.POSTER,
                status: MediaStatus.ACTIVE,
              },
              orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
              take: 1,
              select: {
                mediaType: true,
                url: true,
              },
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
      select: {
        sourceProvider: true,
        externalId: true,
      },
    },
  },
});

export type PersonWithDetails = Prisma.MoviePersonGetPayload<
  typeof personDetailArgs
>;

const personSearchArgs = Prisma.validator<Prisma.MoviePersonDefaultArgs>()({
  select: {
    id: true,
    name: true,
    nameEn: true,
    profileUrl: true,
    credits: {
      select: {
        creditType: true,
      },
    },
  },
});

export type PersonSearchRecord = Prisma.MoviePersonGetPayload<
  typeof personSearchArgs
>;

@Injectable()
export class PeopleRepository {
  constructor(private readonly prisma: PrismaService) {}

  search(query: string, limit: number): Prisma.PrismaPromise<PersonSearchRecord[]> {
    const keyword = query.trim();

    return this.prisma.moviePerson.findMany({
      where: {
        OR: [
          {
            name: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          {
            nameEn: {
              contains: keyword,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: limit,
      ...personSearchArgs,
    });
  }

  findById(personId: string) {
    return this.prisma.moviePerson.findUnique({
      where: {
        id: personId,
      },
      ...personDetailArgs,
    });
  }
}
