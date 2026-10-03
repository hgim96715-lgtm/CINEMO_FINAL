import { ApiProperty } from "@nestjs/swagger";

export class KobisDailyBoxOfficeItemResponseDto {
  @ApiProperty({
    description: "일별 박스오피스 순위",
    example: "1",
  })
  rank!: string;

  @ApiProperty({
    description:
      "전일 대비 순위 변동. 양수는 순위 상승, 음수는 순위 하락을 의미",
    example: "2",
  })
  rankInten!: string;

  @ApiProperty({
    description: "KOBIS에서 사용하는 영화 고유 식별자",
    example: "20266766",
  })
  movieCd!: string;

  @ApiProperty({
    description: "영화 제목",
    example: "어벤져스: 엔드게임",
  })
  movieNm!: string;

  @ApiProperty({
    description: "영화 개봉일",
    example: "2019-04-24",
    nullable: true,
  })
  openDt!: string | null;

  @ApiProperty({
    description: "해당 날짜의 관객수",
    example: "12500",
  })
  audiCnt!: string;

  @ApiProperty({
    description: "누적 관객수",
    example: "13900000",
  })
  audiAcc!: string;

  @ApiProperty({
    description: "전일 대비 관객수 증감",
    example: "1200",
  })
  audiInten!: string;

  @ApiProperty({
    description: "전일 대비 관객수 증감률(%)",
    example: "10.6",
  })
  audiChange!: string;

  @ApiProperty({
    description: "전주 대비 누적 관객수 증감",
    example: "5000",
  })
  audiIntenAcc!: string;

  @ApiProperty({
    description: "전주 대비 누적 관객수 증감률(%)",
    example: "3.7",
  })
  audiChangeAcc!: string;
}

export class KobisDailyBoxOfficeResponseDto {
  @ApiProperty({
    type: [KobisDailyBoxOfficeItemResponseDto],
  })
  results!: KobisDailyBoxOfficeItemResponseDto[];
}
