import { ApiProperty } from "@nestjs/swagger";

export class KobisDailyBoxOfficeItemResponseDto {
  @ApiProperty({ example: "1" })
  rank!: string;

  @ApiProperty({ example: "20266766" })
  movieCd!: string;

  @ApiProperty({ example: "어벤져스: 엔드게임" })
  movieNm!: string;

  @ApiProperty({ example: "2019-04-24", nullable: true })
  openDt!: string | null;

  @ApiProperty({ example: "12500" })
  audiCnt!: string;

  @ApiProperty({ example: "13900000" })
  audiAcc!: string;

  @ApiProperty({ example: "1200" })
  audiInten!: string;

  @ApiProperty({ example: "10.6" })
  audiChange!: string;

  @ApiProperty({ example: "5000" })
  audiIntenAcc!: string;

  @ApiProperty({ example: "3.7" })
  audiChangeAcc!: string;
}

export class KobisDailyBoxOfficeResponseDto {
  @ApiProperty({
    type: [KobisDailyBoxOfficeItemResponseDto],
  })
  results!: KobisDailyBoxOfficeItemResponseDto[];
}
