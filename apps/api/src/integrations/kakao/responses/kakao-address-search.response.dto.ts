import { ApiProperty } from "@nestjs/swagger";

import { KakaoAddressSearchItemResponseDto } from "./kakao-address-search-item.response.dto";
import { KakaoAddressSearchMetaResponseDto } from "./kakao-address-search-meta.response.dto";

export class KakaoAddressSearchResponseDto {
  @ApiProperty({
    description: "주소 검색 메타 정보",
    type: KakaoAddressSearchMetaResponseDto,
  })
  meta!: KakaoAddressSearchMetaResponseDto;

  @ApiProperty({
    description: "Kakao 주소 검색 결과 목록",
    type: [KakaoAddressSearchItemResponseDto],
  })
  documents!: KakaoAddressSearchItemResponseDto[];
}
