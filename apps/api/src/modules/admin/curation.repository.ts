import {
  CurationStatus,
  MediaStatus,
  MediaType,
  Prisma,
} from "@prisma/client";
import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/prisma/prisma.service";

const curationInclude = Prisma.validator<Prisma.CurationDefaultArgs>()({
  include: {
    movies: {
      orderBy: { sortOrder: "asc" },
      include: {
        movie: {
          include: {
            titles: {
              orderBy: { createdAt: "asc" },
            },
            releases: {
              orderBy: [{ isPrimary: "desc" }, { releaseDate: "desc" }],
              take: 1,
            },
            media: {
              where: {
                mediaType: MediaType.POSTER,
                status: MediaStatus.ACTIVE,
              },
              orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
              take: 1,
            },
          },
        },
      },
    },
  },
});

export type CurationWithMovies = Prisma.CurationGetPayload<
  typeof curationInclude
>;

export type CurationMovieInput = {
  movieId: string;
  reason?: string | null;
  sortOrder: number;
};

export type CreateCurationInput = {
  slug: string;
  eyebrow: string;
  title: string;
  description?: string | null;
  status?: CurationStatus;
  startsAt?: Date | null;
  endsAt?: Date | null;
  sortOrder?: number;
  movies: CurationMovieInput[];
};

export type UpdateCurationInput = Partial<
  Omit<CreateCurationInput, "movies">
> & {
  movies?: CurationMovieInput[];
};

@Injectable()
export class CurationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<CurationWithMovies[]> {
    return this.prisma.curation.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      ...curationInclude,
    });
  }

  findById(id: string): Promise<CurationWithMovies | null> {
    return this.prisma.curation.findUnique({
      where: { id },
      ...curationInclude,
    });
  }

  findActive(now = new Date()): Promise<CurationWithMovies[]> {
    return this.prisma.curation.findMany({
      where: {
        status: CurationStatus.PUBLISHED,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      ...curationInclude,
    });
  }

  create(input: CreateCurationInput): Promise<CurationWithMovies> {
    return this.prisma.curation.create({
      data: {
        slug: input.slug,
        eyebrow: input.eyebrow,
        title: input.title,
        description: input.description,
        status: input.status,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        sortOrder: input.sortOrder,
        movies: {
          create: input.movies.map((movie) => ({
            movieId: movie.movieId,
            reason: movie.reason,
            sortOrder: movie.sortOrder,
          })),
        },
      },
      ...curationInclude,
    });
  }

  update(id: string, input: UpdateCurationInput): Promise<CurationWithMovies> {
    return this.prisma.$transaction(async (tx) => {
      await tx.curation.update({
        where: { id },
        data: {
          slug: input.slug,
          eyebrow: input.eyebrow,
          title: input.title,
          description: input.description,
          status: input.status,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          sortOrder: input.sortOrder,
        },
      });

      if (input.movies) {
        await tx.curationMovie.deleteMany({
          where: { curationId: id },
        });

        if (input.movies.length > 0) {
          await tx.curationMovie.createMany({
            data: input.movies.map((movie) => ({
              curationId: id,
              movieId: movie.movieId,
              reason: movie.reason,
              sortOrder: movie.sortOrder,
            })),
          });
        }
      }

      return tx.curation.findUniqueOrThrow({
        where: { id },
        ...curationInclude,
      });
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.curation.delete({ where: { id } });
  }
}
