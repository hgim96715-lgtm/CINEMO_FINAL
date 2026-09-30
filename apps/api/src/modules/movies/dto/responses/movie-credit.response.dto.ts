import { ApiProperty } from "@nestjs/swagger";

import { MoviePersonResponseDto } from "./movie-person.response.dto";

export class MovieCreditResponseDto {
  @ApiProperty({
    description: "영화와 인물 연결 레코드 식별자",
    example: "0199b4f5-7c9d-7abc-8def-123456789abc",
  })
  id!: string;

  @ApiProperty({
    description: "인물 역할",
    enum: ["DIRECTOR", "ACTOR"],
    example: "ACTOR",
  })
  creditType!: "DIRECTOR" | "ACTOR";

  @ApiProperty({
    description: "배우가 연기한 배역 이름",
    nullable: true,
    example: "토니 스타크",
  })
  characterName!: string | null;

  @ApiProperty({
    description: "상세 화면에 표시할 인물 순서",
    nullable: true,
    example: 1,
  })
  displayOrder!: number | null;

  @ApiProperty({
    description: "연결된 인물 정보",
    type: MoviePersonResponseDto,
  })
  person!: MoviePersonResponseDto;
}
