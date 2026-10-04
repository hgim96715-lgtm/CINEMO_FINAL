import { ApiProperty } from "@nestjs/swagger";

import { MovieMediaResponseDto } from "./movie-media.response.dto";
import { MovieProviderLinkResponseDto } from "./movie-provider-link.response.dto";
import { MovieReleaseResponseDto } from "./movie-release.response.dto";
import { MovieTitleResponseDto } from "./movie-title.response.dto";
import { MovieWatchOptionResponseDto } from "./movie-watch-option.response.dto";
import { MovieCreditResponseDto } from "./movie-credit.response.dto";
import { MovieGenreResponseDto } from "./movie-genre.response.dto";

export class MovieResponseDto {
  @ApiProperty({ description: "CINEMO 내부 영화 식별자" })
  id!: string;

  @ApiProperty({
    description: "영화 제목 목록",
    type: [MovieTitleResponseDto],
  })
  titles!: MovieTitleResponseDto[];

  @ApiProperty({
    description: "최초 개봉·재개봉 정보 목록",
    type: [MovieReleaseResponseDto],
  })
  releases!: MovieReleaseResponseDto[];

  @ApiProperty({
    description: "외부 영화 provider 연결 목록",
    type: [MovieProviderLinkResponseDto],
  })
  providerLinks!: MovieProviderLinkResponseDto[];

  @ApiProperty({
    description: "포스터·배경·예고편 목록",
    type: [MovieMediaResponseDto],
  })
  media!: MovieMediaResponseDto[];

  @ApiProperty({
    description: "영화 제작 국가 ISO 코드 목록",
    example: ["JP"],
    type: [String],
  })
  productionCountryCodes!: string[];

  @ApiProperty({
    description: "시청 가능한 플랫폼 목록",
    type: [MovieWatchOptionResponseDto],
  })
  watchOptions!: MovieWatchOptionResponseDto[];

  @ApiProperty({
    description: "영화 장르 목록",
    type: [MovieGenreResponseDto],
  })
  genres!: MovieGenreResponseDto[];

  @ApiProperty({
    description: "영화와 감독·배우 연결 목록",
    type: [MovieCreditResponseDto],
  })
  credits!: MovieCreditResponseDto[];

  @ApiProperty({
    description: "영화 줄거리",
    type: String,
    nullable: true,
  })
  overview!: string | null;

  @ApiProperty({
    description: "상영 시간(분)",
    type: Number,
    nullable: true,
  })
  runtime!: number | null;

  @ApiProperty({
    description: "TMDB 평균 평점",
    type: Number,
    nullable: true,
  })
  tmdbVoteAverage!: number | null;

  @ApiProperty({
    description: "TMDB 평점 참여자 수",
    type: Number,
    nullable: true,
  })
  tmdbVoteCount!: number | null;

  @ApiProperty({ description: "영화 레코드 생성 시각" })
  createdAt!: string;

  @ApiProperty({ description: "영화 레코드 수정 시각" })
  updatedAt!: string;
}
