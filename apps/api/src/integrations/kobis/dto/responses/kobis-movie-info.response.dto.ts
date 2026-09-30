import { ApiProperty } from "@nestjs/swagger";

export class KobisMovieInfoResponseDto {
  @ApiProperty({
    description: "KOBIS 영화 식별자",
    example: "20266766",
  })
  movieCd!: string;

  @ApiProperty({
    description: "기본 영화 제목",
    example: "어벤져스: 엔드게임",
  })
  title!: string;

  @ApiProperty({
    description: "외국어 영화 제목",
    nullable: true,
  })
  foreignTitle!: string | null;

  @ApiProperty({
    description: "원제",
    nullable: true,
  })
  originalTitle!: string | null;

  @ApiProperty({
    description: "상영 시간(분)",
    nullable: true,
    example: 181,
  })
  runningTime!: number | null;

  @ApiProperty({
    description: "제작 연도",
    nullable: true,
  })
  productionYear!: string | null;

  @ApiProperty({
    description: "최초 개봉일",
    nullable: true,
  })
  releaseDate!: string | null;

  @ApiProperty({
    description: "제작 상태",
    nullable: true,
  })
  productionStatus!: string | null;

  @ApiProperty({
    description: "영화 유형",
    nullable: true,
  })
  typeName!: string | null;

  @ApiProperty({
    description: "국가 목록",
    type: [String],
  })
  nations!: string[];

  @ApiProperty({
    description: "장르 목록",
    type: [String],
  })
  genres!: string[];

  @ApiProperty({
    description: "감독 이름 목록",
    type: [String],
  })
  directors!: string[];

  @ApiProperty({
    description: "배우 이름 목록",
    type: [String],
  })
  actors!: string[];

  @ApiProperty({
    description: "제작사 이름 목록",
    type: [String],
  })
  companies!: string[];

  @ApiProperty({
    description: "관람등급 목록",
    type: [String],
  })
  certifications!: string[];
}
