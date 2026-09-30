import { ApiProperty } from "@nestjs/swagger";
import { MovieSearchItemResponseDto } from "./movie-search-item.response.dto";

export class MovieSearchResponseDto {
  @ApiProperty({
    description: "영화 검색 결과 목록",
    type: [MovieSearchItemResponseDto],
  })
  items!: MovieSearchItemResponseDto[];

  @ApiProperty({
    description: "전체 검색 결과 수",
    example: 23,
  })
  totalCount!: number;

  @ApiProperty({
    description: "현재 페이지",
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: "페이지당 결과 수",
    example: 10,
  })
  limit!: number;
}
