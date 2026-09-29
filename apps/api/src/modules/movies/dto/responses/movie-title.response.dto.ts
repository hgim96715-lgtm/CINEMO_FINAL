import { ApiProperty } from "@nestjs/swagger";

export class MovieTitleResponseDto {
  @ApiProperty({ description: "영화 제목 레코드 식별자" })
  id!: string;

  @ApiProperty({ description: "화면이나 검색에 표시할 제목" })
  title!: string;

  @ApiProperty({ description: "제목 종류", example: "PRIMARY" })
  titleType!: string;

  @ApiProperty({
    description: "제목의 언어 코드",
    type: String,
    nullable: true,
    example: "ko",
  })
  languageCode!: string | null;

  @ApiProperty({
    description: "연결된 개봉 정보 식별자",
    type: String,
    nullable: true,
  })
  releaseId!: string | null;
}
