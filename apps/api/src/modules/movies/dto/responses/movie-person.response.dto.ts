import { ApiProperty } from "@nestjs/swagger";

export class MoviePersonResponseDto {
  @ApiProperty({
    description: "인물 식별자",
    example: "0199b4f5-7c9d-7abc-8def-123456789abc",
  })
  id!: string;

  @ApiProperty({
    description: "인물 이름",
    example: "안소니 루소",
  })
  name!: string;

  @ApiProperty({
    description: "외국어 또는 원문 인물 이름",
    type: String,
    nullable: true,
    example: "Anthony Russo",
  })
  nameEn!: string | null;
}
