import { ApiProperty } from "@nestjs/swagger";

export class KobisMovieSearchItemResponseDto {
  @ApiProperty({ description: "KOBIS 영화 식별자" })
  movieCd!: string;

  @ApiProperty({ description: "기본 영화 제목" })
  title!: string;

  @ApiProperty({
    description: "외국어 영화 제목",
    nullable: true,
  })
  foreignTitle!: string | null;

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
    description: "영화 유형",
    nullable: true,
  })
  typeName!: string | null;

  @ApiProperty({
    description: "제작 상태",
    nullable: true,
  })
  productionStatus!: string | null;

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
}
