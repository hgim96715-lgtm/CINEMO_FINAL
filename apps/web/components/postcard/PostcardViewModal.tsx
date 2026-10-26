"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Postcard } from "@/lib/api/postcards";
import { deletePostcard } from "@/lib/api/postcards";
import { PostcardSceneMeta } from "@/components/postcard/PostcardSceneMeta";
import { PostcardQuoteContent } from "@/components/postcard/PostcardQuoteContent";
import Link from "next/link";
import { AppModal } from "@/components/ui/app-modal";
import Image from "next/image";
import { useState } from "react";
import {
  myPostcardsQueryOptions,
  postcardFeedQueryOptions,
} from "@/lib/queries/postcard-feed.query";

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () =>
      postcard ? deletePostcard(postcard.id) : Promise.resolve(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: myPostcardsQueryOptions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: postcardFeedQueryOptions().queryKey,
        }),
      ]);
      setDeleteConfirmOpen(false);
      onOpenChange(false);
    },
  });

  if (!postcard) {
    return null;
  }
  const imageUrl = postcard.media[0]?.url ?? postcard.movie?.posterUrl ?? null;

  const imageAlt =
    postcard.media[0]?.altText ?? `${postcard.movie?.title ?? "영화"} 포스터`;

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        title={postcard.movie?.title ?? "내 엽서"}
        description={`${postcardTypeLabels[postcard.type]} · ${formatDate(
          postcard.createdAt,
        )} 작성`}
        className="max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto scrollbar-none"
        footer={
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
          <Link
            href={`/lobby/postcards/${postcard.id}`}
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-cinemo-muted transition hover:border-cinemo-gold/50 hover:text-cinemo-gold"
          >
            댓글 보기
          </Link>

          <Link
            href={`/my-cinema/postcards/${postcard.id}/edit`}
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-cinemo-gold px-4 py-2 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
          >
            수정하기
          </Link>

          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={deleteMutation.isPending}
            className="rounded-xl border border-red-300/30 px-4 py-2 text-sm text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"
          >
            엽서 삭제
          </button>
          </div>
        }
      >
        <div className="space-y-5">
          {imageUrl && (
            <div className="flex justify-center">
              <div className="relative h-40 w-28 overflow-hidden rounded-xl bg-[#172322]">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  sizes="112px"
                  className="object-contain"
                />
              </div>
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
      <AppModal
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending) setDeleteConfirmOpen(open);
        }}
        title="엽서 삭제"
        description="이 엽서를 삭제할까요? 삭제 후에는 복구할 수 없습니다."
        showCloseButton={false}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-cinemo-muted disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-red-500/80 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </button>
          </>
        }
      >
        {deleteMutation.isError && (
          <p className="text-center text-xs text-red-300">
            엽서를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}
      </AppModal>
    </>
  );
}
