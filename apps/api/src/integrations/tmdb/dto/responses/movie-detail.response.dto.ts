import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { TmdbMovieGenreResponseDto } from "./movie-genres.response.dto";

export class TmdbMovieCollectionResponseDto {
  @ApiProperty({ example: 86311 })
  id!: number;

  @ApiProperty({ example: "어벤져스 시리즈" })
  name!: string;

  @ApiPropertyOptional({ nullable: true, example: "/collection-poster.jpg" })
  poster_path!: string | null;

  @ApiPropertyOptional({ nullable: true, example: "/collection-backdrop.jpg" })
  backdrop_path!: string | null;
}

export class TmdbProductionCompanyResponseDto {
  @ApiProperty({ example: 420 })
  id!: number;

  @ApiPropertyOptional({ nullable: true, example: "/company-logo.png" })
  logo_path!: string | null;

  @ApiProperty({ example: "Marvel Studios" })
  name!: string;

  @ApiProperty({ example: "US" })
  origin_country!: string;
}

export class TmdbProductionCountryResponseDto {
  @ApiProperty({ example: "US" })
  iso_3166_1!: string;

  @ApiProperty({ example: "United States of America" })
  name!: string;
}

export class TmdbSpokenLanguageResponseDto {
  @ApiProperty({ example: "English" })
  english_name!: string;

  @ApiProperty({ example: "en" })
  iso_639_1!: string;

  @ApiProperty({ example: "English" })
  name!: string;
}

export class TmdbMovieDetailResponseDto {
  @ApiProperty({
    example: false,
  })
  adult!: boolean;

  @ApiProperty({
    example: 299534,
  })
  id!: number;

  @ApiProperty({
    example: "en",
  })
  original_language!: string;

  @ApiProperty({
    example: "어벤져스: 엔드게임",
  })
  title!: string;

  @ApiProperty({
    example: "Avengers: Endgame",
  })
  original_title!: string;

  @ApiProperty({
    example: "2019-04-24",
  })
  release_date!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: "/poster.jpg",
  })
  poster_path!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: "/backdrop.jpg",
  })
  backdrop_path!: string | null;

  @ApiProperty({
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
    example: 28855,
  })
  vote_count!: number;

  @ApiProperty({
    type: [TmdbMovieGenreResponseDto],
  })
  genres!: TmdbMovieGenreResponseDto[];

  @ApiPropertyOptional({
    nullable: true,
    type: TmdbMovieCollectionResponseDto,
  })
  belongs_to_collection!: TmdbMovieCollectionResponseDto | null;

  @ApiProperty({ example: 356000000 })
  budget!: number;

  @ApiPropertyOptional({ nullable: true, example: "https://www.marvel.com" })
  homepage!: string | null;

  @ApiPropertyOptional({ nullable: true, example: "tt4154796" })
  imdb_id!: string | null;

  @ApiProperty({ type: [String], example: ["US"] })
  origin_country!: string[];

  @ApiProperty({ type: [TmdbProductionCompanyResponseDto] })
  production_companies!: TmdbProductionCompanyResponseDto[];

  @ApiProperty({ type: [TmdbProductionCountryResponseDto] })
  production_countries!: TmdbProductionCountryResponseDto[];

  @ApiProperty({ example: 2885439100 })
  revenue!: number;

  @ApiPropertyOptional({ nullable: true, example: 181 })
  runtime!: number | null;

  @ApiProperty({ type: [TmdbSpokenLanguageResponseDto] })
  spoken_languages!: TmdbSpokenLanguageResponseDto[];

  @ApiProperty({ example: "Released" })
  status!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: "운명을 바꿀 최후의 전쟁이 펼쳐진다",
  })
  tagline!: string | null;
}
