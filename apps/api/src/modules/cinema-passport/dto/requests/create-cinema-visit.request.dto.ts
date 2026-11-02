import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CinemaVisitVerificationType } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateCinemaVisitRequestDto {
  @ApiProperty({
    description: "방문한 영화관 ID",
    format: "uuid",
  })
  @IsUUID()
  venueId!: string;

  @ApiPropertyOptional({
    description: "연결할 영화 관람 기록 ID",
    format: "uuid",
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  movieRecordId?: string | null;

  @ApiPropertyOptional({
    description: "실제 방문 시각",
    example: "2026-10-28T12:30:00+09:00",
  })
  @IsOptional()
  @IsDateString()
  visitedAt?: string;

  @ApiPropertyOptional({
    enum: CinemaVisitVerificationType,
    default: CinemaVisitVerificationType.MANUAL,
  })
  @IsOptional()
  @IsEnum(CinemaVisitVerificationType)
  verificationType?: CinemaVisitVerificationType;

  @ApiPropertyOptional({
    description: "방문 메모",
    maxLength: 1000,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string | null;

  @ApiProperty({
    description: "중복 요청 방지 키",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  idempotencyKey!: string;
}
