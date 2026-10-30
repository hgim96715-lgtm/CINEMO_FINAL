import { ApiProperty } from "@nestjs/swagger";

import { MovieSearchItemResponseDto } from "./movie-search-item.response.dto";
import { SearchGenreItemResponseDto } from "./search-genre-item.response.dto";
import { SearchPersonItemResponseDto } from "./search-person-item.response.dto";

export class UnifiedSearchResponseDto {
  @ApiProperty({
    description: "영화 검색 결과",
    type: [MovieSearchItemResponseDto],
  })
  movies!: MovieSearchItemResponseDto[];

  @ApiProperty({
    description: "인물 검색 결과",
    type: [SearchPersonItemResponseDto],
  })
  people!: SearchPersonItemResponseDto[];

  @ApiProperty({
    description: "장르 검색 결과",
    type: [SearchGenreItemResponseDto],
  })
  genres!: SearchGenreItemResponseDto[];
}
