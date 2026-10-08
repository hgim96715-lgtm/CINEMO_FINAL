import { ApiProperty } from "@nestjs/swagger";

export class TmdbPersonDetailResponseDto {
  @ApiProperty({
    description: "TMDB 외부 인물 식별자",
    type: Number,
    example: 135651,
  })
  id!: number;

  @ApiProperty({
    description: "인물 이름",
    type: String,
    example: "Michael B. Jordan",
  })
  name!: string;

  @ApiProperty({
    description: "인물 원문 이름",
    type: String,
    example: "Michael Bakari Jordan",
  })
  original_name!: string;

  @ApiProperty({
    description: "인물 소개",
    type: String,
    example: "Michael B. Jordan is an American actor and filmmaker.",
  })
  biography!: string;

  @ApiProperty({
    description: "출생일",
    type: String,
    nullable: true,
    example: "1987-02-09",
  })
  birthday!: string | null;

  @ApiProperty({
    description: "출생지",
    type: String,
    nullable: true,
    example: "Santa Ana, California, USA",
  })
  place_of_birth!: string | null;

  @ApiProperty({
    description: "TMDB 프로필 이미지 경로",
    type: String,
    nullable: true,
    example: "/profile.jpg",
  })
  profile_path!: string | null;

  @ApiProperty({
    description: "주요 활동 분야",
    type: String,
    nullable: true,
    example: "Acting",
  })
  known_for_department!: string | null;

  @ApiProperty({
    description: "사망일",
    type: String,
    nullable: true,
    example: null,
  })
  deathday!: string | null;
}
