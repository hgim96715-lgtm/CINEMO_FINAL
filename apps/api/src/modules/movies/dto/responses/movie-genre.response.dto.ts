import { ApiProperty } from "@nestjs/swagger";

export class MovieGenreResponseDto {
  @ApiProperty({
    description: "장르 레코드 식별자",
    example: "0199b4f5-7c9d-7abc-8def-123456789abc",
  })
  id!: string;

  @ApiProperty({
    description: "provider 또는 CINEMO 내부 장르 보조 코드",
    nullable: true,
    example: "KOBIS_1",
  })
  code!: string | null;

  @ApiProperty({
    description: "장르명",
    example: "액션",
  })
  name!: string;
}
