import type { CinemaVisitResponseDto } from "../dto/responses/cinema-visit.response.dto";
import type { CinemaVisitRecord } from "../repositories/cinema-visit.repository";

export type CinemaVisitResponse = CinemaVisitResponseDto;

export class CinemaVisitMapper {
  static toResponse(visit: CinemaVisitRecord): CinemaVisitResponse {
    return {
      id: visit.id,
      venueId: visit.venueId,
      movieRecordId: visit.movieRecordId,
      visitedAt: visit.visitedAt.toISOString(),
      verificationType: visit.verificationType,
      verificationStatus: visit.verificationStatus,
      verifiedAt: visit.verifiedAt?.toISOString() ?? null,
      note: visit.note,
      createdAt: visit.createdAt.toISOString(),
      updatedAt: visit.updatedAt.toISOString(),
      venue: visit.venue
        ? {
            id: visit.venue.id,
            name: visit.venue.name,
            brand: visit.venue.brandName,
            address: visit.venue.jibunAddress,
          }
        : null,
      movieRecord: visit.movieRecord
        ? {
            id: visit.movieRecord.id,
            movieId: visit.movieRecord.movieId,
          }
        : null,
    };
  }
  static toResponseList(visits: CinemaVisitRecord[]): CinemaVisitResponse[] {
    return visits.map((visit) => this.toResponse(visit));
  }
}
