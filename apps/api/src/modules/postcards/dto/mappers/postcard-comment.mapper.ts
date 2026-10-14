import type { PostcardComment } from "@prisma/client";

import { PostcardCommentResponseDto } from "../responses/postcard-comment.response.dto";

type PostcardCommentWithUser = PostcardComment & {
  user: {
    id: string;
    nickname: string;
    profileImageUrl: string | null;
  };
};

export function toPostcardCommentResponse(
  comment: PostcardCommentWithUser,
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
    author: {
      id: comment.user.id,
      nickname: comment.user.nickname,
      profileImageUrl: comment.user.profileImageUrl,
    },
  };
}
