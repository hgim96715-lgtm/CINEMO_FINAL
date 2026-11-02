import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CurationStatus } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { CurationMovieRequestDto } from "./curation-movie.request.dto";

export class CreateCurationRequestDto {
  @ApiProperty({ description: "관리자에서 사용할 큐레이션 식별자", example: "student-independence-day" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
  })
  slug!: string;

  @ApiProperty({ description: "Hero 상단에 표시할 짧은 문구", example: "11월 3일 학생독립운동 기념일" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eyebrow!: string;

  @ApiProperty({ description: "큐레이션 제목", example: "학생독립운동 기념일에 함께 보는 영화" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: "큐레이션 설명", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ enum: CurationStatus, default: CurationStatus.DRAFT })
  @IsOptional()
  @IsEnum(CurationStatus)
  status?: CurationStatus;

  @ApiPropertyOptional({ description: "노출 시작 시각(ISO 8601)", nullable: true })
  @IsOptional()
  @IsISO8601()
  startsAt?: string | null;

  @ApiPropertyOptional({ description: "노출 종료 시각(ISO 8601)", nullable: true })
  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;

  @ApiPropertyOptional({ description: "Hero 노출 우선순위", default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ type: [CurationMovieRequestDto], description: "큐레이션에 포함할 영화 목록" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurationMovieRequestDto)
  movies!: CurationMovieRequestDto[];
}
