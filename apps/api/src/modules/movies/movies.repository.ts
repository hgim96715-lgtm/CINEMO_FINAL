import { Injectable } from "@nestjs/common";
import { MatchStatus, MediaStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MoviesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(movieId: string) {
    return this.prisma.movie.findUnique({
      where: {
        id: movieId,
      },
      include: {
        titles: {
          orderBy: {
            titleType: "asc",
          },
        },
        releases: {
          orderBy: [{ isPrimary: "desc" }, { releaseDate: "desc" }],
        },
        media: {
          where: {
            status: MediaStatus.ACTIVE,
          },
          orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
        },
        providerLinks: {
          where: {
            matchStatus: MatchStatus.APPROVED,
          },
        },
        watchOptions: {
          where: {
            regionCode: "KR",
          },
          orderBy: [{ watchProvider: "asc" }, { availabilityType: "asc" }],
        },
      },
    });
  }
}
