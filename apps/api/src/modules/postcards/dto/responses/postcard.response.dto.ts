import {ApiProperty} from "@nestjs/swagger";
import {PostcardSource, PostcardStatus, PostcardType, PostcardVisibility} from "@prisma/client";

export class PostcardResponseDto {
  @ApiProperty({
    description: "엽서 ID",
    format: "uuid",
  })
  id!: string;
  
  @ApiProperty({
    description: "영화 ID",
    format: "uuid",
  })
  movieId!: string;
  
  @ApiProperty({
    description: "엽서 유형",
    enum: PostcardType,
    example: PostcardType.REVIEW,
  })
  type!: PostcardType;
  
  @ApiProperty({
    description: "엽서 생성 방식",
    enum: PostcardSource,
    example: PostcardSource.USER,
  })
  source!: PostcardSource;
  
  @ApiProperty({
    description: "엽서 내용",
    example: "영화를 보고 난 뒤 오래 남은 장면",
  })
  content!: string;
  
  @ApiProperty({
    description: "엽서 배경 스타일",
    type: String,
    nullable: true,
    example: "midnight",
  })
  backgroundStyle!: string | null;

  @ApiProperty({
    description: "Cloud Storage 배경 이미지 식별자",
    type: String,
    nullable: true,
    example: "postcards/backgrounds/01.webp",
  })
  backgroundImageKey!: string | null;

  @ApiProperty({ description: "이모지 반응 수", example: 12 })
  reactionCount!: number;

  @ApiProperty({ description: "댓글 수", example: 4 })
  commentCount!: number;

  @ApiProperty({ description: "공유 수", example: 2 })
  shareCount!: number;
  
  @ApiProperty({
    description: "엽서 공개 상태",
    enum: PostcardVisibility,
    example: PostcardVisibility.PUBLIC,
  })
  visibility!: PostcardVisibility;
  
  @ApiProperty({
    description: "엽서 처리 상태",
    enum: PostcardStatus,
    example: PostcardStatus.DRAFT,
  })
  status!: PostcardStatus;
  
  @ApiProperty({
    description: "생성 시각",
    type: String,
    format: "date-time",
  })
  createdAt!: string;
  
  @ApiProperty({
    description: "수정 시각",
    type: String,
    format: "date-time",
  })
  updatedAt!: string;
}
