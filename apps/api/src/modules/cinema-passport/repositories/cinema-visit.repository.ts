import { Injectable } from "@nestjs/common";
import {
  CinemaVisitVerificationStatus,
  CinemaVisitVerificationType,
  Prisma,
  VenueType,
} from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

const venueSelect = {
  id: true,
  type: true,
  name: true,
  brandName: true,
  region1Code: true,
  region1Name: true,
  region2Code: true,
  region2Name: true,
  roadAddress: true,
  jibunAddress: true,
} satisfies Prisma.VenueSelect;

const cinemaVisitSelect = {
  id: true,
  userId: true,
  venueId: true,
  movieRecordId: true,
  visitedAt: true,
  verificationType: true,
  verificationStatus: true,
  verifiedAt: true,
  note: true,
  evidenceMetadata: true,
  idempotencyKey: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  venue: {
    select: venueSelect,
  },
  movieRecord: {
    select: {
      id: true,
      movieId: true,
    },
  },
} satisfies Prisma.CinemaVisitSelect;

export type CinemaVisitRecord = Prisma.CinemaVisitGetPayload<{
  select: typeof cinemaVisitSelect;
}>;

type CreateCinemaVisitInput = {
  userId: string;
  venueId: string;
  movieRecordId?: string | null;
  visitedAt: Date;
  verificationType: CinemaVisitVerificationType;
  verificationStatus: CinemaVisitVerificationStatus;
  verifiedAt?: Date | null;
  note?: string | null;
  evidenceMetadata?: Prisma.InputJsonValue | null;
  idempotencyKey: string;
};

@Injectable()
export class CinemaVisitRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCinemaVenue(
    venueId: string,
  ): Promise<Prisma.VenueGetPayload<{ select: typeof venueSelect }> | null> {
    return this.prisma.venue.findFirst({
      where: {
        id: venueId,
        type: VenueType.CINEMA,
      },
      select: venueSelect,
    });
  }

  async findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<CinemaVisitRecord | null> {
    return this.prisma.cinemaVisit.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey,
        },
      },
      select: cinemaVisitSelect,
    });
  }

  async create(input: CreateCinemaVisitInput): Promise<CinemaVisitRecord> {
    return this.prisma.cinemaVisit.create({
      data: {
        userId: input.userId,
        venueId: input.venueId,
        movieRecordId: input.movieRecordId ?? null,
        visitedAt: input.visitedAt,
        verificationType: input.verificationType,
        verificationStatus: input.verificationStatus,
        verifiedAt: input.verifiedAt ?? null,
        note: input.note ?? null,
        evidenceMetadata: input.evidenceMetadata ?? undefined,
        idempotencyKey: input.idempotencyKey,
      },
      select: cinemaVisitSelect,
    });
  }

  async findAllByUser(userId: string): Promise<CinemaVisitRecord[]> {
    return this.prisma.cinemaVisit.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        visitedAt: "desc",
      },
      select: cinemaVisitSelect,
    });
  }

  async findAllByUserAndVenue(
    userId: string,
    venueId: string,
  ): Promise<CinemaVisitRecord[]> {
    return this.prisma.cinemaVisit.findMany({
      where: {
        userId,
        venueId,
        deletedAt: null,
      },
      orderBy: {
        visitedAt: "desc",
      },
      select: cinemaVisitSelect,
    });
  }

  async deleteById(
    userId: string,
    visitId: string,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.cinemaVisit.updateMany({
      where: {
        id: visitId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
