import { ApiProperty } from "@nestjs/swagger";

export class MovieMediaResponseDto {
  @ApiProperty({ description: "미디어 종류", example: "POSTER" })
  mediaType!: string;

  @ApiProperty({ description: "미디어 원본 provider", example: "TMDB" })
  sourceProvider!: string;

  @ApiProperty({ description: "포스터·배경·예고편 주소" })
  url!: string;

  @ApiProperty({
    description: "provider가 발급한 미디어 식별자",
    type: String,
    nullable: true,
  })
  externalId!: string | null;

  @ApiProperty({ description: "대표 미디어 여부" })
  isPrimary!: boolean;

  @ApiProperty({ description: "미디어 사용 상태", example: "ACTIVE" })
  status!: string;

  @ApiProperty({
    description: "미디어 주소를 마지막으로 확인한 시각",
    type: String,
    nullable: true,
  })
  verifiedAt!: string | null;

  @ApiProperty({
    description: "연결된 개봉 정보 식별자",
    type: String,
    nullable: true,
  })
  releaseId!: string | null;
}
