import { ApiProperty } from "@nestjs/swagger";

import { PostcardNotificationResponseDto } from "./postcard-notification.response.dto";

export class PostcardNotificationFeedResponseDto {
  @ApiProperty({ type: [PostcardNotificationResponseDto] })
  items!: PostcardNotificationResponseDto[];

  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;

  @ApiProperty()
  hasNextPage!: boolean;
}
