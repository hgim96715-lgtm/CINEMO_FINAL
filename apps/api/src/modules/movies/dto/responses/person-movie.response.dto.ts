import { ApiProperty } from "@nestjs/swagger";

export class PersonMovieResponseDto {
  @ApiProperty({
    description: "출연·연출 영화 식별자",
    example: "01a1164c-f3a2-7048-bcdb-723fa5c64872",
  })
  id!: string;

  @ApiProperty({
    description: "영화 대표 제목",
    example: "인턴",
  })
  title!: string;

  @ApiProperty({
    description: "영화의 대표 개봉일",
    nullable: true,
    example: "2015-09-23T00:00:00.000Z",
    type: Date,
  })
  releaseDate!: Date | null;

  @ApiProperty({
    description: "영화 포스터 주소",
    type: String,
    nullable: true,
    example: "https://image.tmdb.org/t/p/w500/poster.jpg",
  })
  posterUrl!: string | null;
}
