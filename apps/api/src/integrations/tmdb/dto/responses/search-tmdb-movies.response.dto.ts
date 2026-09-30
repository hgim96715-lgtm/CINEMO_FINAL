import { ApiProperty } from "@nestjs/swagger";

export class TmdbMovieSearchItemResponseDto {
  @ApiProperty({
    example: false,
  })
  adult!: boolean;

  @ApiProperty({
    description: "TMDB 외부 영화 식별자",
    example: 550,
  })
  id!: number;

  @ApiProperty({
    type: [Number],
    example: [18],
  })
  genre_ids!: number[];

  @ApiProperty({
    description: "요청 언어 기준 영화 제목",
    example: "파이트 클럽",
  })
  title!: string;

  @ApiProperty({
    description: "원문 영화 제목",
    example: "Fight Club",
  })
  original_title!: string;

  @ApiProperty({
    example: "en",
  })
  original_language!: string;

  @ApiProperty({
    description: "TMDB 개봉일",
    example: "1999-10-15",
  })
  release_date!: string;

  @ApiProperty({
    description: "포스터 부분 경로",
    example: "/path-to-poster.jpg",
    nullable: true,
  })
  poster_path!: string | null;

  @ApiProperty({
    description: "배경 이미지 부분 경로",
    example: "/path-to-backdrop.jpg",
    nullable: true,
  })
  backdrop_path!: string | null;

  @ApiProperty({
    description: "영화 줄거리",
    example: "영화 줄거리",
  })
  overview!: string;

  @ApiProperty({
    example: 128.7776,
  })
  popularity!: number;

  @ApiProperty({
    example: false,
  })
  video!: boolean;

  @ApiProperty({
    example: 8.245,
  })
  vote_average!: number;

  @ApiProperty({
    example: 28851,
  })
  vote_count!: number;
}

export class SearchTmdbMoviesResponseDto {
  @ApiProperty({
    description: "현재 페이지",
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: "TMDB 영화 검색 결과",
    type: [TmdbMovieSearchItemResponseDto],
  })
  results!: TmdbMovieSearchItemResponseDto[];

  @ApiProperty({
    description: "전체 페이지 수",
    example: 1,
  })
  total_pages!: number;

  @ApiProperty({
    description: "전체 검색 결과 수",
    example: 1,
  })
  total_results!: number;
}
