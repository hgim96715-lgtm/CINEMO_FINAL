import { ApiProperty } from "@nestjs/swagger";

import { KobisMovieSearchItemResponseDto } from "./kobis-movie-search-item.response.dto";

export class KobisMovieSearchResponseDto {
  @ApiProperty({
    description: "검색 조건에 해당하는 전체 영화 수",
    example: 24,
  })
  totalCount!: number;

  @ApiProperty({
    description: "KOBIS 영화 검색 결과",
    type: [KobisMovieSearchItemResponseDto],
  })
  results!: KobisMovieSearchItemResponseDto[];
}
