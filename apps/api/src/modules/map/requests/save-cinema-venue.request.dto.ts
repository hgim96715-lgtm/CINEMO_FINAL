import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty, IsString} from "class-validator";

export class SaveVenueRequestDto {
    @ApiProperty({
        description: "Kakao 장소 식별자",
        example: "14718298",
    })
    @IsString()
    @IsNotEmpty()
    id!: string;

    @ApiProperty({
        description: "관람 장소명",
        example: "CGV 청담씨네시티",
    })
    @IsString()
    @IsNotEmpty()
    place_name!: string;

    @ApiProperty({
        description: "Kakao 장소 분류 경로",
        example: "문화,예술 > 영화,영상 > 영화관 > CGV",
    })
    @IsString()
    @IsNotEmpty()
    category_name!: string;

    @ApiProperty({
        description: "Kakao 분류 그룹 코드",
        example: "CT1",
    })
    @IsString()
    @IsNotEmpty()
    category_group_code!: string;

    @ApiProperty({
        description: "Kakao 분류 그룹명",
        example: "문화시설",
    })
    @IsString()
    @IsNotEmpty()
    category_group_name!: string;

    @ApiProperty({
        description: "전화번호",
        example: "1544-1122",
    })
    @IsString()
    phone!: string;

    @ApiProperty({
        description: "지번 주소",
        example: "서울 강남구 신사동 651-21",
    })
    @IsString()
    address_name!: string;

    @ApiProperty({
        description: "도로명 주소",
        example: "서울 강남구 도산대로 323",
    })
    @IsString()
    road_address_name!: string;

    @ApiProperty({
        description: "Kakao 장소 상세 URL",
        example: "http://place.map.kakao.com/14718298",
    })
    @IsString()
    place_url!: string;

    @ApiProperty({
        description: "검색 기준 위치와의 거리",
        example: "",
    })
    @IsString()
    distance!: string;

    @ApiProperty({
        description: "경도",
        example: "127.037032355109",
    })
    @IsString()
    x!: string;

    @ApiProperty({
        description: "위도",
        example: "37.5229506730658",
    })
    @IsString()
    y!: string;
}
