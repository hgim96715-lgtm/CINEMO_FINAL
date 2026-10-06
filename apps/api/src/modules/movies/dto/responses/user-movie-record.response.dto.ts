import { ApiProperty } from "@nestjs/swagger";

export class UserMovieRecordResponseDto {
  @ApiProperty({
    description: "영화 ID",
    format: "uuid",
  })
  movieId!: string;

  @ApiProperty({
    description: "찜하기 여부",
  })
  isFavorite!: boolean;

  @ApiProperty({
    description: "봤어요 여부",
  })
  isWatched!: boolean;

  @ApiProperty({
    description: "봤어요 처리 시각",
    type: String,
    format: "date-time",
    nullable: true,
  })
  watchedAt!: string | null;

  @ApiProperty({
    description: "개인 평점",
    type: String,
    example: "4.5",
    nullable: true,
  })
  rating!: string | null;
}
