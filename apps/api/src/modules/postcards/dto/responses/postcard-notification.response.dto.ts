import { ApiProperty } from "@nestjs/swagger";
import { PostcardNotificationType } from "@prisma/client";

export class PostcardNotificationResponseDto {
  @ApiProperty({ description: "알림 ID", format: "uuid" })
  id!: string;

  @ApiProperty({ description: "알림 유형", enum: PostcardNotificationType })
  type!: PostcardNotificationType;

  @ApiProperty({
    description: "관련 엽서 ID",
    format: "uuid",
    nullable: true,
    type: String,
  })
  postcardId!: string | null;

  @ApiProperty({
    description: "관련 댓글 ID",
    format: "uuid",
    nullable: true,
    type: String,
  })
  commentId!: string | null;

  @ApiProperty({
    description: "반응에 사용된 이모지",
    nullable: true,
    type: String,
    example: "❤️",
  })
  reactionEmoji!: string | null;

  @ApiProperty({
    description: "알림을 발생시킨 사용자",
    nullable: true,
    type: Object,
  })
  actor!: {
    id: string;
    nickname: string;
    profileImageUrl: string | null;
  } | null;

  @ApiProperty({
    description: "알림을 읽은 시각. 읽지 않았으면 null",
    nullable: true,
    type: String,
    format: "date-time",
  })
  readAt!: string | null;

  @ApiProperty({
    description: "알림 생성 시각",
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}
