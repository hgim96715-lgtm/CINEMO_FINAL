"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { useSetPostcardHeart } from "@/lib/queries/postcard.mutation";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { AppModal } from "@/components/ui/app-modal";

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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleClick = () => {
    if (heartMutation.isPending) {
      return;
    }
    if (!user) {
      setLoginModalOpen(true);
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
    <>
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
      <AppModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        title="로그인 후 이용 가능합니다."
        description="로그인하시겠습니까?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setLoginModalOpen(false)}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-cinemo-muted"
            >
              취소
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginModalOpen(false);
                router.push("/login");
              }}
              className="rounded-xl bg-cinemo-gold px-4 py-2 text-sm font-semibold text-cinemo-bg"
            >
              로그인 하러가기
            </button>
          </>
        }
      />
    </>
  );
}
