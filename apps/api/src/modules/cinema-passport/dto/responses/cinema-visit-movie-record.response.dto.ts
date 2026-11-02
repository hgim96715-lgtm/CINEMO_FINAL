import { ApiProperty } from "@nestjs/swagger";

export class CinemaVisitMovieRecordResponseDto {
  @ApiProperty({
    description: "영화 관람 기록 ID",
    type: String,
    format: "uuid",
  })
  id!: string;

  @ApiProperty({
    description: "영화 ID",
    type: String,
    format: "uuid",
  })
  movieId!: string;
}
