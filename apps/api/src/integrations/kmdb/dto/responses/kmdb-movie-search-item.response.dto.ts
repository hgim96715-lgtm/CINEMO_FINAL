import { ApiProperty } from "@nestjs/swagger";

import { KmdbRatingResponseDto } from "./kmdb-rating.response.dto";

export class KmdbMovieSearchItemResponseDto {
  @ApiProperty({ description: "KMDb 외부 영화 식별자" })
  docId!: string;

  @ApiProperty({ description: "대표 영화 제목", nullable: true })
  title!: string | null;

  @ApiProperty({ description: "다른 언어 제목", nullable: true })
  titleEng!: string | null;

  @ApiProperty({ description: "원작·원어 제목", nullable: true })
  titleOrg!: string | null;

  @ApiProperty({ description: "제작 연도", nullable: true })
  productionYear!: string | null;

  @ApiProperty({ description: "제작 국가·지역", nullable: true })
  nation!: string | null;

  @ApiProperty({ description: "상영 시간(분)", nullable: true })
  runtime!: number | null;

  @ApiProperty({ description: "관람 등급", nullable: true })
  rating!: string | null;

  @ApiProperty({
    description: "심의 및 심의 당시 개봉일 정보",
    type: [KmdbRatingResponseDto],
  })
  ratings!: KmdbRatingResponseDto[];

  @ApiProperty({ description: "장르 목록", type: [String] })
  genres!: string[];

  @ApiProperty({ description: "감독 이름 목록", type: [String] })
  directors!: string[];

  @ApiProperty({ description: "배우 이름 목록", type: [String] })
  actors!: string[];

  @ApiProperty({ description: "포스터 주소 목록", type: [String] })
  posterUrls!: string[];

  @ApiProperty({ description: "한국어 줄거리", nullable: true })
  plot!: string | null;

  @ApiProperty({ description: "KMDb 상세 페이지 주소", nullable: true })
  kmdbUrl!: string | null;
}
