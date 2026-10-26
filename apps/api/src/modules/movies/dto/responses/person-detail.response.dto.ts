import { ApiProperty } from "@nestjs/swagger";

import { PersonCreditResponseDto } from "./person-credit.response.dto";

export class PersonDetailResponseDto {
  @ApiProperty({
    description: "인물 식별자",
    type: String,
    example: "01a11519-f54c-73ff-8854-3abd1028d22c",
  })
  id!: string;

  @ApiProperty({
    description: "연결된 TMDB 인물 식별자",
    type: String,
    nullable: true,
    example: "24001",
  })
  tmdbPersonId!: string | null;

  @ApiProperty({
    description: "인물의 한국어 이름",
    type: String,
    example: "알레한드로 곤살레스 이냐리투",
  })
  name!: string;

  @ApiProperty({
    description: "인물의 영문 또는 원문 이름",
    type: String,
    nullable: true,
    example: "Alejandro G. Iñárritu",
  })
  nameEn!: string | null;

  @ApiProperty({
    description: "인물 프로필 이미지 주소",
    type: String,
    nullable: true,
    example: "https://image.tmdb.org/t/p/w500/profile.jpg",
  })
  profileUrl!: string | null;

  @ApiProperty({
    description: "인물 소개",
    type: String,
    nullable: true,
    example: "멕시코 출신의 영화 감독이자 각본가",
  })
  biography!: string | null;

  @ApiProperty({
    description: "인물 출생일",
    type: Date,
    nullable: true,
    example: "1963-08-15",
  })
  birthDate!: Date | null;

  @ApiProperty({
    description: "인물 출생지",
    type: String,
    nullable: true,
    example: "Mexico City, Mexico",
  })
  birthPlace!: string | null;

  @ApiProperty({
    description: "인물 국적",
    type: String,
    nullable: true,
    example: "멕시코",
  })
  nationality!: string | null;

  @ApiProperty({
    description: "인물이 참여한 영화와 담당 역할 목록",
    type: [PersonCreditResponseDto],
  })
  credits!: PersonCreditResponseDto[];
}
