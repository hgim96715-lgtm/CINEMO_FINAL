import { ApiProperty } from "@nestjs/swagger";

export class KmdbRatingResponseDto {
  @ApiProperty({ nullable: true, example: "Y" })
  ratingMain!: string | null;

  @ApiProperty({ nullable: true, example: "20250325" })
  ratingDate!: string | null;

  @ApiProperty({ nullable: true, example: "2025-MF00728" })
  ratingNo!: string | null;

  @ApiProperty({ nullable: true, example: "청소년 관람불가" })
  ratingGrade!: string | null;

  @ApiProperty({ nullable: true, example: "20250416", type: String })
  releaseDate!: string | null;

  @ApiProperty({ nullable: true, example: "123", type: String })
  runtime!: string | null;
}
