import { ApiProperty } from "@nestjs/swagger";

import { KmdbMovieSearchItemResponseDto } from "./kmdb-movie-search-item.response.dto";

export class KmdbMovieSearchResponseDto {
  @ApiProperty({
    description: "전체 검색 결과 수",
    example: 24,
  })
  totalCount!: number;

  @ApiProperty({
    description: "KMDb 영화 검색 결과",
    type: [KmdbMovieSearchItemResponseDto],
  })
  results!: KmdbMovieSearchItemResponseDto[];
}
