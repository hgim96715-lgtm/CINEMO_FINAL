import { ApiProperty } from "@nestjs/swagger";

export class TmdbPersonSearchItemResponseDto {
  @ApiProperty({
    description: "TMDB 외부 인물 식별자",
    type: Number,
    example: 135651,
  })
  id!: number;

  @ApiProperty({
    description: "TMDB 인물 이름",
    type: String,
    example: "마이클 B. 조던",
  })
  name!: string;

  @ApiProperty({
    description: "TMDB 인물 원문 이름",
    type: String,
    example: "Michael B. Jordan",
  })
  original_name!: string;

  @ApiProperty({
    description: "TMDB 프로필 이미지 부분 경로",
    type: String,
    nullable: true,
    example: "/profile.jpg",
  })
  profile_path!: string | null;

  @ApiProperty({
    description: "TMDB 기준 주요 활동 분야",
    type: String,
    nullable: true,
    example: "Acting",
  })
  known_for_department!: string | null;
}

export class SearchTmdbPeopleResponseDto {
  @ApiProperty({
    description: "현재 페이지",
    type: Number,
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: "TMDB 인물 검색 결과",
    type: [TmdbPersonSearchItemResponseDto],
  })
  results!: TmdbPersonSearchItemResponseDto[];

  @ApiProperty({
    description: "전체 페이지 수",
    type: Number,
    example: 1,
  })
  total_pages!: number;

  @ApiProperty({
    description: "전체 검색 결과 수",
    type: Number,
    example: 1,
  })
  total_results!: number;
}
