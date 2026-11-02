import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CinemaVisitVerificationStatus,
  CinemaVisitVerificationType,
} from "@prisma/client";
import { CinemaVisitMovieRecordResponseDto } from "./cinema-visit-movie-record.response.dto";
import { CinemaVisitVenueResponseDto } from "./cinema-visit-venue.response.dto";

export class CinemaVisitResponseDto {
  @ApiProperty({
    description: "영화관 방문 기록 ID",
    type: String,
    format: "uuid",
  })
  id!: string;

  @ApiProperty({
    description: "영화관 ID",
    type: String,
    format: "uuid",
  })
  venueId!: string;

  @ApiPropertyOptional({
    description: "연결된 영화 관람 기록 ID",
    type: String,
    format: "uuid",
    nullable: true,
  })
  movieRecordId!: string | null;

  @ApiProperty({
    description: "영화관 방문 일시",
    type: String,
    format: "date-time",
  })
  visitedAt!: string;

  @ApiProperty({
    description: "방문 인증 방식",
    enum: CinemaVisitVerificationType,
    enumName: "CinemaVisitVerificationType",
  })
  verificationType!: CinemaVisitVerificationType;

  @ApiProperty({
    description: "방문 인증 상태",
    enum: CinemaVisitVerificationStatus,
    enumName: "CinemaVisitVerificationStatus",
  })
  verificationStatus!: CinemaVisitVerificationStatus;

  @ApiPropertyOptional({
    description: "인증 완료 일시",
    type: String,
    format: "date-time",
    nullable: true,
  })
  verifiedAt!: string | null;

  @ApiPropertyOptional({
    description: "방문 메모",
    type: String,
    nullable: true,
  })
  note!: string | null;

  @ApiProperty({
    description: "기록 생성 일시",
    type: String,
    format: "date-time",
  })
  createdAt!: string;

  @ApiProperty({
    description: "기록 수정 일시",
    type: String,
    format: "date-time",
  })
  updatedAt!: string;

  @ApiPropertyOptional({
    description: "방문한 영화관 정보",
    type: CinemaVisitVenueResponseDto,
    nullable: true,
  })
  venue!: CinemaVisitVenueResponseDto | null;

  @ApiPropertyOptional({
    description: "연결된 영화 관람 기록",
    type: CinemaVisitMovieRecordResponseDto,
    nullable: true,
  })
  movieRecord!: CinemaVisitMovieRecordResponseDto | null;
}
