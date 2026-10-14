"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";

import { useSharePostcard } from "@/lib/queries/postcard.mutation";

type PostcardShareButtonProps = {
  postcardId: string;
  title: string;
  shareCount?: number;
};

export function PostcardShareButton({
  postcardId,
  title,
  shareCount,
}: PostcardShareButtonProps) {
  const shareMutation = useSharePostcard();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setMessage("");
    }, 2000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [message]);

  const handleShare = async () => {
    const url = window.location.href;

    try {
      const canNativeShare = typeof navigator.share === "function";
      const channel = canNativeShare ? "native" : "copy_link";

      if (canNativeShare) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }

      await shareMutation.mutateAsync({
        postcardId,
        input: { channel },
      });

      setMessage(canNativeShare ? "공유했어요" : "링크를 복사했어요");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setMessage("공유하지 못했어요");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="공유"
        title="공유"
        onClick={handleShare}
        disabled={shareMutation.isPending}
        className="inline-flex items-center gap-1.5 text-sm text-cinemo-muted transition hover:text-cinemo-gold disabled:opacity-50"
      >
        <Share2 className="size-4" aria-hidden="true" />
        {shareCount !== undefined && (
          <span className="tabular-nums">{shareCount}</span>
        )}
      </button>

      {message && <span className="text-xs text-cinemo-gold">{message}</span>}
    </div>
  );
}
