import { ApiProperty } from "@nestjs/swagger";

export class KakaoAddressInfoResponseDto {
  @ApiProperty({ description: "전체 지번 주소", example: "서울 강남구 신사동 651-21" })
  address_name!: string;

  @ApiProperty({ description: "시·도 이름", example: "서울특별시" })
  region_1depth_name!: string;

  @ApiProperty({ description: "시·군·구 이름", example: "강남구" })
  region_2depth_name!: string;

  @ApiProperty({ description: "읍·면·동 이름", example: "신사동" })
  region_3depth_name!: string;

  @ApiProperty({ description: "행정동 이름", example: "신사동" })
  region_3depth_h_name!: string;

  @ApiProperty({ description: "행정동 코드", example: "1168067500" })
  h_code!: string;

  @ApiProperty({ description: "법정동 코드", example: "1168010700" })
  b_code!: string;

  @ApiProperty({ description: "산 여부", example: "N" })
  mountain_yn!: string;

  @ApiProperty({ description: "지번 주번지", example: "651" })
  main_address_no!: string;

  @ApiProperty({ description: "지번 부번지", example: "21" })
  sub_address_no!: string;

  @ApiProperty({ description: "경도", example: "127.037043534807" })
  x!: string;

  @ApiProperty({ description: "위도", example: "37.5229110254398" })
  y!: string;
}
