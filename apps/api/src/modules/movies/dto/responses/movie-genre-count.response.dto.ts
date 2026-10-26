import { ApiProperty } from "@nestjs/swagger";

export class MovieGenreCountResponseDto {
  @ApiProperty({
    example: "드라마",
    description: "장르명",
  })
  genre!: string;

  @ApiProperty({
    example: 18,
    description: "해당 기간에 개봉한 영화 수",
  })
  count!: number;
}
