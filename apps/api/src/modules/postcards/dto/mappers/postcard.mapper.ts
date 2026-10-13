import type {Postcard} from "@prisma/client";

import {PostcardResponseDto} from "../responses/postcard.response.dto";

export function  toPostcardResponse(postcard:Postcard):PostcardResponseDto{
  return {
    id:postcard.id,
    movieId:postcard.movieId,
    type:postcard.type,
    source:postcard.source,
    content:postcard.content,
    backgroundStyle:postcard.backgroundStyle,
    backgroundImageKey:postcard.backgroundImageKey,
    reactionCount:postcard.reactionCount,
    commentCount:postcard.commentCount,
    shareCount:postcard.shareCount,
    visibility:postcard.visibility,
    status:postcard.status,
    createdAt:postcard.createdAt.toISOString(),
    updatedAt:postcard.updatedAt.toISOString()
  }

}
