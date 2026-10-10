import {ApiProperty} from "@nestjs/swagger";
import {Type} from "class-transformer";
import {IsInt, IsNotEmpty, IsString, Max, MaxLength, Min,} from "class-validator";

export class SearchKakaoAddressRequestDto {
    @ApiProperty({
        description: "검색할 도로명 또는 지번 주소",
        example: "서울 강남구 도산대로 323",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    query!: string;

    @ApiProperty({
        description: "조회할 페이지 번호",
        example: 1,
        default: 1,
        required: false,
        type: Number,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(45)
    page: number = 1;

    @ApiProperty({
        description: "페이지당 조회할 주소 수",
        example: 10,
        default: 10,
        required: false,
        type: Number,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(30)
    size: number = 10;
}