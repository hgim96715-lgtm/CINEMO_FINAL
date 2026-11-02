import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CurationStatus } from "@prisma/client";

export class CurationMovieResponseDto {
  @ApiProperty({ description: "CINEMO 내부 영화 UUID" })
  id!: string;

  @ApiProperty({ description: "영화 제목" })
  title!: string;

  @ApiPropertyOptional({ description: "영화 포스터 주소", nullable: true })
  posterUrl!: string | null;

  @ApiPropertyOptional({ description: "대표 개봉일", nullable: true })
  releaseDate!: string | null;

  @ApiPropertyOptional({ description: "큐레이션에서 사용하는 설명", nullable: true })
  reason!: string | null;

  @ApiProperty({ description: "큐레이션 내 노출 순서" })
  sortOrder!: number;
}

export class CurationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  eyebrow!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: CurationStatus })
  status!: CurationStatus;

  @ApiPropertyOptional({ nullable: true })
  startsAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  endsAt!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: [CurationMovieResponseDto] })
  movies!: CurationMovieResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
