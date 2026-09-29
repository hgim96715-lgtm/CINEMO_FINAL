import { ApiProperty } from "@nestjs/swagger";

export class MovieReleaseResponseDto {
  @ApiProperty({ description: "개봉 정보 식별자" })
  id!: string;

  @ApiProperty({
    description: "개봉일. 미정이면 null",
    type: String,
    nullable: true,
    example: "2026-09-30",
  })
  releaseDate!: string | null;

  @ApiProperty({ description: "최초 개봉 또는 재개봉 구분" })
  releaseType!: string;

  @ApiProperty({ description: "개봉 정보 상태" })
  status!: string;

  @ApiProperty({
    description: "개봉 국가 코드",
    type: String,
    nullable: true,
    example: "KR",
  })
  countryCode!: string | null;

  @ApiProperty({ description: "대표 개봉 정보 여부" })
  isPrimary!: boolean;
}
