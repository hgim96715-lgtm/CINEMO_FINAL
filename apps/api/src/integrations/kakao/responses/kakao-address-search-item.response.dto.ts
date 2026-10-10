import { ApiProperty } from "@nestjs/swagger";

import { KakaoAddressInfoResponseDto } from "./kakao-address-info.response.dto";
import { KakaoRoadAddressInfoResponseDto } from "./kakao-road-address-info.response.dto";

export class KakaoAddressSearchItemResponseDto {
  @ApiProperty({ description: "주소 검색 결과의 대표 주소", example: "서울 강남구 신사동 651-21" })
  address_name!: string;

  @ApiProperty({ description: "주소 유형", example: "REGION_ADDR" })
  address_type!: string;

  @ApiProperty({ description: "경도", example: "127.037032355109" })
  x!: string;

  @ApiProperty({ description: "위도", example: "37.5229506730658" })
  y!: string;

  @ApiProperty({
    type: KakaoAddressInfoResponseDto,
    nullable: true,
  })
  address!: KakaoAddressInfoResponseDto | null;

  @ApiProperty({
    type: KakaoRoadAddressInfoResponseDto,
    nullable: true,
  })
  road_address!: KakaoRoadAddressInfoResponseDto | null;
}
