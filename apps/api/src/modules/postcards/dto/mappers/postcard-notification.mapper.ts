import { PostcardNotificationResponseDto } from "../responses/postcard-notification.response.dto";
import type { PostcardNotificationWithActor } from "../../repositories/postcard.repository";

export function toPostcardNotificationResponse(
  notification: PostcardNotificationWithActor,
): PostcardNotificationResponseDto {
  return {
    id: notification.id,
    type: notification.type,
    postcardId: notification.postcardId,
    commentId: notification.commentId,
    reactionEmoji: notification.reactionEmoji,
    actor: notification.actor,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}
