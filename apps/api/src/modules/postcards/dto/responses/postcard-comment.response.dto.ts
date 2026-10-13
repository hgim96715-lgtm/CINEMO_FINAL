import {ApiProperty} from "@nestjs/swagger";
import {PostcardCommentStatus} from "@prisma/client";

export class PostcardCommentResponseDto {
  @ApiProperty({
    description: "댓글 ID",
    format: "uuid",
  })
  id!: string;
  
  @ApiProperty({
    description: "엽서 ID",
    format: "uuid",
  })
  postcardId!: string;
  
  @ApiProperty({
    description: "대댓글 대상 댓글 ID",
    format: "uuid",
    nullable: true,
    type:String,
  })
  parentId!: string | null;
  
  @ApiProperty({
    description: "댓글 내용",
    example: "이 장면이 가장 오래 기억에 남았어요.",
  })
  content!: string;
  
  @ApiProperty({
    description: "댓글 상태",
    enum: PostcardCommentStatus,
    example: PostcardCommentStatus.PUBLISHED,
  })
  status!: PostcardCommentStatus;

  @ApiProperty({ description: "댓글 이모지 반응 수", example: 3 })
  reactionCount!: number;

  @ApiProperty({ description: "대댓글 수", example: 2 })
  replyCount!: number;
  
  @ApiProperty({
    description: "작성 시각",
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
