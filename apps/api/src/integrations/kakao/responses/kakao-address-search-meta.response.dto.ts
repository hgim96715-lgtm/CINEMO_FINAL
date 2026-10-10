import { ApiProperty } from "@nestjs/swagger";

export class KakaoAddressSearchMetaResponseDto {
  @ApiProperty({ description: "검색된 전체 주소 수", example: 1 })
  total_count!: number;

  @ApiProperty({ description: "페이지로 조회 가능한 주소 수", example: 1 })
  pageable_count!: number;

  @ApiProperty({ description: "현재 페이지가 마지막인지 여부", example: true })
  is_end!: boolean;
}
