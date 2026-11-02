import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateCinemaVisitRequestDto } from "./dto/requests/create-cinema-visit.request.dto";
import {
  CinemaVisitMapper,
  CinemaVisitResponse,
} from "./mappers/cinema-visit.mapper";
import {
  CinemaVisitRecord,
  CinemaVisitRepository,
} from "./repositories/cinema-visit.repository";
import {
  CinemaVisitVerificationStatus,
  CinemaVisitVerificationType,
} from "@prisma/client";
import { ActivityService } from "@/modules/activity/activity.service";
import { UserActivityType } from "@prisma/client";

type StampSummary = {
  venueId: string;
  visitCount: number;
  firstVisitedAt: string;
  lastVisitedAt: string;
};

type CinemaVisitResult = {
  visit: CinemaVisitResponse;
  stamp: StampSummary;
};

@Injectable()
export class CinemaVisitService {
  constructor(
    private readonly cinemaVisitRepository: CinemaVisitRepository,
    private readonly activityService: ActivityService,
  ) {}
  async create(
    userId: string,
    dto: CreateCinemaVisitRequestDto,
  ): Promise<CinemaVisitResult> {
    const existing = await this.cinemaVisitRepository.findByIdempotencyKey(
      userId,
      dto.idempotencyKey,
    );
    if (existing) {
      const visits = await this.cinemaVisitRepository.findAllByUser(userId);
      return this.createResponse(existing, visits);
    }
    const venue = await this.cinemaVisitRepository.findCinemaVenue(dto.venueId);
    if (!venue) {
      throw new NotFoundException("영화관을 찾을 수 없습니다.");
    }
    const visitedAt = dto.visitedAt ? new Date(dto.visitedAt) : new Date();
    if (Number.isNaN(visitedAt.getTime())) {
      throw new BadRequestException("방문 일시 형식이 올바르지 않습니다.");
    }
    const verificationType =
      dto.verificationType ?? CinemaVisitVerificationType.MANUAL;
    const verificationStatus = this.getVerificationStatus(verificationType);
    const visit = await this.cinemaVisitRepository.create({
      userId,
      venueId: dto.venueId,
      movieRecordId: dto.movieRecordId ?? null,
      visitedAt,
      verificationType,
      verificationStatus,
      verifiedAt:
        verificationStatus === CinemaVisitVerificationStatus.VERIFIED
          ? new Date()
          : null,
      note: dto.note ?? null,
      idempotencyKey: dto.idempotencyKey,
    });
    const visits = await this.cinemaVisitRepository.findAllByUser(userId);
    void this.activityService.record({
      userId,
      type: UserActivityType.CINEMA_VISIT_CREATE,
      targetType: "venue",
      targetId: dto.venueId,
      metadata: { verificationType },
    });
    return this.createResponse(visit, visits);
  }

  async findAllByUser(userId: string): Promise<CinemaVisitResponse[]> {
    const visits = await this.cinemaVisitRepository.findAllByUser(userId);
    return CinemaVisitMapper.toResponseList(visits);
  }

  async findAllByUserAndVenue(
    userId: string,
    venueId: string,
  ): Promise<CinemaVisitResponse[]> {
    const visits = await this.cinemaVisitRepository.findAllByUserAndVenue(
      userId,
      venueId,
    );
    return CinemaVisitMapper.toResponseList(visits);
  }

  async remove(userId: string, visitId: string): Promise<void> {
    const result = await this.cinemaVisitRepository.deleteById(userId, visitId);
    if (result.count === 0) {
      throw new NotFoundException("영화관 방문 기록을 찾을 수 없습니다.");
    }
    void this.activityService.record({
      userId,
      type: UserActivityType.CINEMA_VISIT_DELETE,
      targetType: "cinema_visit",
      targetId: visitId,
    });
  }

  private getVerificationStatus(
    type: CinemaVisitVerificationType,
  ): CinemaVisitVerificationStatus {
    if (
      type === CinemaVisitVerificationType.LOCATION ||
      type === CinemaVisitVerificationType.RESERVATION
    ) {
      return CinemaVisitVerificationStatus.VERIFIED;
    }

    if (type === CinemaVisitVerificationType.RECEIPT) {
      return CinemaVisitVerificationStatus.PENDING;
    }

    return CinemaVisitVerificationStatus.UNVERIFIED;
  }

  private createResponse(
    visit: CinemaVisitRecord,
    visits: CinemaVisitRecord[],
  ): CinemaVisitResult {
    const venueVisits = new Map(
      visits
        .filter((item) => item.venueId === visit.venueId)
        .map((item) => [item.id, item]),
    );
    venueVisits.set(visit.id, visit);
    const visitList = [...venueVisits.values()];
    const visitedDates = visitList.map((item) => item.visitedAt.getTime());
    return {
      visit: CinemaVisitMapper.toResponse(visit),
      stamp: {
        venueId: visit.venueId,
        visitCount: visitList.length,
        firstVisitedAt: new Date(Math.min(...visitedDates)).toISOString(),
        lastVisitedAt: new Date(Math.max(...visitedDates)).toISOString(),
      },
    };
  }
}
