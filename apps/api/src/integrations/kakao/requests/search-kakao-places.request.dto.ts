import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsInt,
    IsNotEmpty,
    IsString,
    Max,
    MaxLength,
    Min,
} from "class-validator";

export class SearchKakaoPlacesRequestDto {
    @ApiProperty({
        description: "검색할 장소명",
        example: "강남 영화관",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
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
        description: "페이지당 조회할 장소 수",
        example: 15,
        default: 15,
        required: false,
        type: Number,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(15)
    size: number = 15;
}