import { ApiProperty } from "@nestjs/swagger";

export class KakaoRoadAddressInfoResponseDto {
  @ApiProperty({ description: "전체 도로명 주소", example: "서울 강남구 도산대로 323" })
  address_name!: string;

  @ApiProperty({ description: "시·도 이름", example: "서울특별시" })
  region_1depth_name!: string;

  @ApiProperty({ description: "시·군·구 이름", example: "강남구" })
  region_2depth_name!: string;

  @ApiProperty({ description: "읍·면·동 이름", example: "신사동" })
  region_3depth_name!: string;

  @ApiProperty({ description: "도로명", example: "도산대로" })
  road_name!: string;

  @ApiProperty({ description: "지하 여부", example: "N" })
  underground_yn!: string;

  @ApiProperty({ description: "건물 본번", example: "323" })
  main_building_no!: string;

  @ApiProperty({ description: "건물 부번", example: "" })
  sub_building_no!: string;

  @ApiProperty({ description: "건물명", example: "청담씨네시티" })
  building_name!: string;

  @ApiProperty({ description: "우편번호", example: "06028" })
  zone_no!: string;

  @ApiProperty({ description: "경도", example: "127.037043534807" })
  x!: string;

  @ApiProperty({ description: "위도", example: "37.5229110254398" })
  y!: string;
}
