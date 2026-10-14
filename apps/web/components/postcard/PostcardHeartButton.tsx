"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { useSetPostcardHeart } from "@/lib/queries/postcard.mutation";

type PostcardHeartButtonProps = {
  postcardId: string;
  reactionCount: number;
  initialReacted?: boolean;
};

export function PostcardHeartButton({
  postcardId,
  reactionCount,
  initialReacted = false,
}: PostcardHeartButtonProps) {
  const [isReacted, setIsReacted] = useState(initialReacted);
  const heartMutation = useSetPostcardHeart();

  const handleClick = () => {
    if (heartMutation.isPending) {
      return;
    }

    const previousReacted = isReacted;
    const nextReacted = !previousReacted;
    setIsReacted(nextReacted);
    heartMutation.mutate(
      {
        postcardId,
        isReacted: previousReacted,
      },
      {
        onSuccess: (data) => {
          setIsReacted(data.reacted);
        },
        onError: () => {
          setIsReacted(previousReacted);
        },
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={heartMutation.isPending}
      aria-label={isReacted ? "하트 반응 취소" : "하트 반응"}
      aria-pressed={isReacted}
      className={`inline-flex h-6 min-w-12 items-center justify-center gap-1.5 transition-colors ${
        isReacted
          ? "text-cinemo-gold"
          : "text-cinemo-muted hover:text-cinemo-gold"
      }`}
    >
      <Heart
        className="size-4"
        fill={isReacted ? "currentColor" : "none"}
        aria-hidden="true"
      />
      <span className="inline-flex w-3 justify-center tabular-nums text-center">
        {reactionCount}
      </span>
    </button>
  );
}
