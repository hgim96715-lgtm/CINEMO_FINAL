"use client";

import type { Postcard } from "@/lib/api/postcards";
import { PostcardSceneMeta } from "@/components/postcard/PostcardSceneMeta";
import { PostcardQuoteContent } from "@/components/postcard/PostcardQuoteContent";
import Link from "next/link";
import { AppModal } from "@/components/ui/app-modal";
import Image from "next/image";

type PostcardViewModalProps = {
  postcard: Postcard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const postcardTypeLabels = {
  REVIEW: "감상",
  QUOTE: "인용",
  SCENE: "장면",
} as const;

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll(" ", "");
};

export function PostcardViewModal({
  postcard,
  open,
  onOpenChange,
}: PostcardViewModalProps) {
  if (!postcard) {
    return null;
  }
  const imageUrl = postcard.media[0]?.url ?? postcard.movie?.posterUrl ?? null;

  const imageAlt =
    postcard.media[0]?.altText ?? `${postcard.movie?.title ?? "영화"} 포스터`;

  const isPublic =
    postcard.status === "PUBLISHED" && postcard.visibility === "PUBLIC";

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={postcard.movie?.title ?? "내 엽서"}
      description={`${postcardTypeLabels[postcard.type]} · ${formatDate(
        postcard.createdAt,
      )} 작성`}
      className="max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto scrollbar-none"
      footer={
        <div className="flex items-center justify-center gap-2">
          {isPublic && (
            <Link
              href={`/lobby/postcards/${postcard.id}`}
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-cinemo-muted transition hover:border-cinemo-gold/50 hover:text-cinemo-gold"
            >
              댓글 보기
            </Link>
          )}

          <Link
            href={`/my-cinema/postcards/${postcard.id}/edit`}
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-cinemo-gold px-4 py-2 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
          >
            수정하기
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        {imageUrl && (
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#172322]">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) calc(100vw - 2rem), 448px"
              className="object-cover"
            />
          </div>
        )}

        <div>
          <p className="text-xs text-cinemo-gold">
            {postcard.author?.nickname ?? "익명"}
          </p>

          <p className="mt-1 text-xs text-cinemo-muted">
            {formatDate(postcard.createdAt)} 작성
          </p>
        </div>

        {postcard.type === "SCENE" && (
          <PostcardSceneMeta metadata={postcard.metadata} />
        )}

        {postcard.type === "QUOTE" ? (
          <PostcardQuoteContent
            content={postcard.content}
            metadata={postcard.metadata}
            className="font-serif text-lg leading-8 text-white"
          />
        ) : (
          <p className="whitespace-pre-wrap wrap-break-word font-serif text-lg leading-8 text-white">
            {postcard.content}
          </p>
        )}
      </div>
    </AppModal>
  );
}
