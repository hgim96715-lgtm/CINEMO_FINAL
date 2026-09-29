import { ApiProperty } from "@nestjs/swagger";

import { MovieMediaResponseDto } from "./movie-media.response.dto";
import { MovieProviderLinkResponseDto } from "./movie-provider-link.response.dto";
import { MovieReleaseResponseDto } from "./movie-release.response.dto";
import { MovieTitleResponseDto } from "./movie-title.response.dto";
import { MovieWatchOptionResponseDto } from "./movie-watch-option.response.dto";

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
    description: "시청 가능한 플랫폼 목록",
    type: [MovieWatchOptionResponseDto],
  })
  watchOptions!: MovieWatchOptionResponseDto[];

  @ApiProperty({ description: "영화 레코드 생성 시각" })
  createdAt!: string;

  @ApiProperty({ description: "영화 레코드 수정 시각" })
  updatedAt!: string;
}
