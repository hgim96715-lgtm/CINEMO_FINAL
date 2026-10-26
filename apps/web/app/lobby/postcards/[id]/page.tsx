"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { postcardDetailQueryOptions } from "@/lib/queries/postcard-detail.query";
import { PostcardSceneMeta } from "@/components/postcard/PostcardSceneMeta";
import { PostcardQuoteContent } from "@/components/postcard/PostcardQuoteContent";
import { ArrowLeft, MessageCircle, UserRound } from "lucide-react";
import { PostcardShareButton } from "@/components/postcard/PostcardShareButton";
import { PostcardHeartButton } from "@/components/postcard/PostcardHeartButton";
import { PostcardCommentSection } from "@/components/postcard/PostcardCommentSection";
import { useAuthStore } from "@/stores/auth.store";
import { postcardCommentsQueryOptions } from "@/lib/queries/postcard-comment.query";
import { useCreatePostcardComment } from "@/lib/queries/postcard-comment.mutation";

const formatPostcardDate = (value: string) => {
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

export default function PostcardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);
  const commentsQuery = useInfiniteQuery(postcardCommentsQueryOptions(id));
  const createCommentMutation = useCreatePostcardComment();

  const postcardQuery = useQuery(postcardDetailQueryOptions(id));

  if (postcardQuery.isPending) {
    return (
      <main className="min-h-screen bg-[#071619] px-6 py-10 text-white">
        엽서를 불러오는 중...
      </main>
    );
  }

  if (postcardQuery.isError || !postcardQuery.data) {
    return (
      <main className="min-h-screen bg-[#071619] px-6 py-10 text-white">
        <p>엽서를 불러오지 못했습니다.</p>

        <Link
          href="/lobby/postcards"
          className="mt-4 inline-block text-cinemo-gold"
        >
          엽서 목록으로 돌아가기
        </Link>
      </main>
    );
  }

  const comments =
    commentsQuery.data?.pages
      .flatMap((page) => page.items)
        .map((comment) => ({
          id: comment.id,
          parentId: comment.parentId,
          content: comment.content,
          createdAt: comment.createdAt,
          status: comment.status,
          author: {
            id:
              typeof comment.author?.id === "string"
                ? comment.author.id
                : "",
            nickname:
              typeof comment.author?.nickname === "string"
                ? comment.author.nickname
              : "익명",
          avatarUrl:
            typeof comment.author?.avatarUrl === "string"
              ? comment.author?.avatarUrl
              : null,
        },
      })) ?? [];

  const postcard = postcardQuery.data;
  const visibleCommentCount = commentsQuery.isSuccess
    ? comments.length
    : postcard.commentCount;
  const imageUrl = postcard.movie?.posterUrl ?? postcard.media[0]?.url;
  const sceneImageUrl =
    postcard.type === "SCENE" ? postcard.media[0]?.url ?? null : null;
  const imageAlt =
    postcard.media[0]?.altText ?? `${postcard.movie?.title ?? "영화"} 포스터`;
  const typeLabel =
    postcard.type === "REVIEW"
      ? "감상"
      : postcard.type === "QUOTE"
        ? "인용"
        : postcard.type === "SCENE"
          ? "장면"
          : "감상";

  return (
    <main className="min-h-screen bg-[#071619] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/lobby/postcards"
          className="inline-flex items-center gap-2 text-sm text-cinemo-muted transition hover:text-cinemo-gold-light"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> 공개 엽서
        </Link>

        <article className="relative mt-6 border-b border-cinemo-gold/40 pb-8 sm:mt-8 sm:pb-10">
          <div className="relative p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="whitespace-nowrap text-[10px] tracking-[0.16em] text-cinemo-gold-light sm:text-xs sm:tracking-[0.2em]">
                  CINEMO POSTCARD
                </p>

                {postcard.movie?.title && (
                  <h1 className="mt-2 line-clamp-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {postcard.movie.title}
                  </h1>
                )}
              </div>

              {imageUrl && (
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-black/20 shadow-lg sm:h-24 sm:w-16">
                  <Image
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    sizes="64px"
                    className="object-contain"
                    priority
                  />
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-xs font-medium tracking-wide text-cinemo-gold">
                {typeLabel}
              </span>
            </div>

            {postcard.type === "SCENE" && (
              <div className="mt-5 sm:mt-6">
                <PostcardSceneMeta metadata={postcard.metadata} />
              </div>
            )}

            {sceneImageUrl && (
              <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-2xl bg-cinemo-bg sm:mt-6">
                <Image
                  src={sceneImageUrl}
                  alt={`${postcard.movie?.title ?? "영화"} 장면 이미지`}
                  fill
                  sizes="(min-width: 640px) 720px, 100vw"
                  className="object-contain"
                />
              </div>
            )}

            {postcard.type === "QUOTE" ? (
              <PostcardQuoteContent
                content={postcard.content}
                metadata={postcard.metadata}
                className="mt-4 font-serif text-[clamp(1.5rem,6vw,2.5rem)] font-semibold leading-[1.25] text-white sm:mt-5 sm:text-3xl sm:leading-[1.4]"
              />
            ) : (
              <p className="mt-4 whitespace-pre-wrap font-serif text-[clamp(1.5rem,6vw,2.5rem)] font-semibold leading-[1.25] text-white sm:mt-5 sm:text-3xl sm:leading-[1.4]">
                {postcard.type === "SCENE"
                  ? `“${postcard.content}”`
                  : postcard.content}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 text-xs text-white/55 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`${postcard.author?.nickname ?? "익명"} 프로필 열기`}
                  className="inline-flex min-w-0 items-center gap-1.5 text-left transition-colors hover:text-cinemo-gold"
                >
                  <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {postcard.author?.nickname ?? "익명"}
                  </span>
                </button>

                <span aria-hidden="true">·</span>
                <time dateTime={postcard.createdAt} className="shrink-0">
                  {formatPostcardDate(postcard.createdAt)}
                </time>
              </div>

              <div className="flex h-6 w-full shrink-0 items-center justify-start gap-5 whitespace-nowrap text-sm text-white/60 sm:w-auto sm:gap-4">
        <PostcardHeartButton
          postcardId={postcard.id}
          reactionCount={postcard.reactionCount}
          initialReacted={postcard.hasReacted}
        />

                <span className="inline-flex shrink-0 items-center gap-1">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  <span className="tabular-nums">{visibleCommentCount}</span>
                </span>
                <PostcardShareButton
                  postcardId={postcard.id}
                  title={postcard.movie?.title ?? "CINEMO 엽서"}
                  shareCount={postcard.shareCount}
                />
              </div>
            </div>
          </div>
        </article>
        <PostcardCommentSection
          postcardId={id}
          comments={comments}
          currentUser={
            currentUser
              ? {
                  id: currentUser.id,
                  nickname: currentUser.nickname,
                  avatarUrl: currentUser.profileImageUrl,
                }
              : null
          }
          isSubmitting={createCommentMutation.isPending}
          onSubmit={async (values, parentId) => {
            await createCommentMutation.mutateAsync({
              postcardId: id,
              input: {
                ...values,
                parentId,
              },
            });
          }}
        />
      </div>
    </main>
  );
}
