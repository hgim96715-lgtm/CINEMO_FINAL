import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SearchPersonItemResponseDto {
  @ApiProperty({
    description: "CINEMO 내부 인물 UUID",
    example: "01a11519-f54c-73ff-8854-3abd1028d22c",
  })
  id!: string;

  @ApiProperty({
    description: "한국어 인물명",
    example: "팀 버튼",
  })
  name!: string;

  @ApiPropertyOptional({
    description: "영문 또는 원문 인물명",
    example: "Tim Burton",
    nullable: true,
  })
  nameEn!: string | null;

  @ApiPropertyOptional({
    description: "인물 프로필 이미지 주소",
    example: "https://image.tmdb.org/t/p/w185/profile.jpg",
    nullable: true,
  })
  profileUrl!: string | null;

  @ApiProperty({
    description: "CINEMO에 연결된 역할 목록",
    example: ["DIRECTOR", "ACTOR"],
    type: [String],
  })
  roles!: Array<"DIRECTOR" | "ACTOR">;
}
