import { ApiProperty } from "@nestjs/swagger";

import { PersonMovieResponseDto } from "./person-movie.response.dto";

export class PersonCreditResponseDto {
  @ApiProperty({
    description: "영화 인물 연결 식별자",
    example: "01a1164c-ef4c-753f-8265-2bcbdf693a9b",
  })
  id!: string;

  @ApiProperty({
    description: "영화에서 담당한 역할",
    enum: ["DIRECTOR", "ACTOR"],
    example: "DIRECTOR",
  })
  creditType!: "DIRECTOR" | "ACTOR";

  @ApiProperty({
    description: "배우가 연기한 배역명",
    nullable: true,
    example: "벤 휘태커",
    type: String,
  })
  characterName!: string | null;

  @ApiProperty({
    description: "상세 화면에 표시할 크레딧 순서",
    nullable: true,
    example: 0,
    type: Number,
  })
  displayOrder!: number | null;

  @ApiProperty({
    description: "연결된 영화 정보",
    type: PersonMovieResponseDto,
  })
  movie!: PersonMovieResponseDto;

  @ApiProperty({
    description: "연결된 인물 식별자",
    example: "01a11519-f54c-73ff-8854-3abd1028d22c",
  })
  personId!: string;
}
