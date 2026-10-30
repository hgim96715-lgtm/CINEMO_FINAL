import { ApiProperty } from "@nestjs/swagger";

export class SearchGenreItemResponseDto {
  @ApiProperty({
    description: "장르명",
    example: "드라마",
  })
  name!: string;

  @ApiProperty({
    description: "해당 장르에 연결된 공개 영화 수",
    example: 128,
  })
  count!: number;
}
