import {ApiProperty} from "@nestjs/swagger";

import {PostcardResponseDto} from "./postcard.response.dto";

export class PostcardFeedResponseDto {
  @ApiProperty({
    description: "공개 엽서 목록",
    type: [PostcardResponseDto],
  })
  items!: PostcardResponseDto[];
  
  @ApiProperty({
    description: "다음 페이지 조회용 커서",
    type: String,
    nullable: true,
    example: "01a12e40-b42f-74cb-b903-61676a3a685a",
  })
  nextCursor!: string | null;
  
  @ApiProperty({
    description: "다음 페이지 존재 여부",
    example: true,
  })
  hasNextPage!: boolean;
}