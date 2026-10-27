import { ApiProperty } from "@nestjs/swagger";

export class CinemaVenueResponseDto {
  @ApiProperty({ example: "01a12345-6789-7abc-8def-0123456789ab" })
  id!: string;

  @ApiProperty({ example: "CGV 수원" })
  name!: string;

  @ApiProperty({ nullable: true, example: "CGV" })
  brandName!: string | null;

  @ApiProperty({ nullable: true, example: "41" })
  region1Code!: string | null;

  @ApiProperty({ nullable: true, example: "경기도" })
  region1Name!: string | null;

  @ApiProperty({ nullable: true, example: "41110" })
  region2Code!: string | null;

  @ApiProperty({ nullable: true, example: "수원시" })
  region2Name!: string | null;

  @ApiProperty({ nullable: true, example: "41110520" })
  region3Code!: string | null;

  @ApiProperty({ nullable: true, example: "영통동" })
  region3Name!: string | null;

  @ApiProperty({ nullable: true, example: "경기도 수원시 영통구 봉영로 1579" })
  roadAddress!: string | null;

  @ApiProperty({ nullable: true, type: Number, example: 37.2636 })
  latitude!: number | null;

  @ApiProperty({ nullable: true, type: Number, example: 127.0286 })
  longitude!: number | null;

  @ApiProperty({ nullable: true, example: "1544-1122" })
  phone!: string | null;

  @ApiProperty({ nullable: true, example: "https://place.map.kakao.com/123456" })
  placeUrl!: string | null;
}
