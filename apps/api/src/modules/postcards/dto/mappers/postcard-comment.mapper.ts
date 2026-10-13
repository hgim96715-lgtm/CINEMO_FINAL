import type {PostcardComment} from "@prisma/client";

import {PostcardCommentResponseDto} from "../responses/postcard-comment.response.dto";

export function toPostcardCommentResponse(
    comment: PostcardComment,
): PostcardCommentResponseDto {
  return {
    id: comment.id,
    postcardId: comment.postcardId,
    parentId: comment.parentId,
    content: comment.content,
    status: comment.status,
    reactionCount: comment.reactionCount,
    replyCount: comment.replyCount,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}
