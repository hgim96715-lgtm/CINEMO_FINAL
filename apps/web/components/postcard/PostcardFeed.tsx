"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { postcardFeedQueryOptions } from "@/lib/queries/postcard-feed.query";
import { PostcardSceneMeta } from "@/components/postcard/PostcardSceneMeta";
import { PostcardQuoteContent } from "@/components/postcard/PostcardQuoteContent";

const postcardTypeLabels = {
  REVIEW: "감상",
  QUOTE: "인용",
  SCENE: "장면",
} as const;

const postcardTypeDescriptions = {
  REVIEW: "영화를 보고 남은 마음",
  QUOTE: "기억하고 싶은 한 문장",
  SCENE: "오래 남은 영화의 순간",
} as const;

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

export function PostcardFeed() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const {
    data,
    isPending,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(postcardFeedQueryOptions());

  const postcards = data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void fetchNextPage();
        }
      },
      {
        rootMargin: "300px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isPending) {
    return <p>엽서를 불러오는 중...</p>;
  }

  if (isError) {
    return <p>엽서를 불러오지 못했습니다.</p>;
  }

  if (postcards.length === 0) {
    return <p>공개된 엽서가 없습니다.</p>;
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-6">
      {postcards.map((postcard) => {
        const imageUrl = postcard.movie?.posterUrl ?? postcard.media[0]?.url;
        const imageAlt =
          postcard.media[0]?.altText ??
          `${postcard.movie?.title ?? "영화"} 포스터`;

        return (
          <Link
            key={postcard.id}
            href={`/lobby/postcards/${postcard.id}`}
            className="group block rounded-[2rem] outline-none"
          >
            <article className="overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.07] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl transition duration-300 group-hover:-translate-y-1 group-hover:border-white/25 group-hover:bg-white/[0.1] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.32)] group-focus-visible:ring-2 group-focus-visible:ring-cinemo-gold sm:rounded-[1.75rem] sm:p-5">
              <div className="flex flex-row items-start gap-4">
                <div className="self-start w-24 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-cinemo-bg sm:w-28">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      width={112}
                      height={168}
                      className="block h-auto w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-white/50">
                      포스터 없음
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-medium tracking-[0.08em] text-white/55 sm:text-xs">
                        {formatPostcardDate(postcard.createdAt)} ·{" "}
                        {postcard.author?.nickname ?? "익명"}
                      </p>
                      <h2 className="mt-2 truncate text-lg font-semibold text-white">
                        {postcard.movie?.title ?? "영화 정보 없음"}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-cinemo-gold px-2.5 py-1 text-xs font-semibold text-cinemo-bg">
                      {postcardTypeLabels[postcard.type]}
                    </span>
                  </div>

                  <p className="mt-3 hidden text-xs leading-5 text-cinemo-muted sm:block">
                    {postcardTypeDescriptions[postcard.type]}
                  </p>

                  {postcard.type === "SCENE" && (
                    <PostcardSceneMeta metadata={postcard.metadata} compact />
                  )}

                  {postcard.type === "QUOTE" ? (
                    <PostcardQuoteContent
                      content={postcard.content}
                      metadata={postcard.metadata}
                      className="mt-2 line-clamp-5 text-sm leading-6 text-white/90"
                    />
                  ) : (
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-white/90">
                      {postcard.content}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-cinemo-muted">
                <span>영화의 순간을 기록</span>
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      postcard.hasReacted ? "text-cinemo-gold" : ""
                    }`}
                    aria-label={`반응 ${postcard.reactionCount}`}
                    title="반응"
                  >
                    <Heart
                      className="size-3.5"
                      fill={postcard.hasReacted ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                    <span className="tabular-nums">
                      {postcard.reactionCount}
                    </span>
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`댓글 ${postcard.commentCount}`}
                    title="댓글"
                  >
                    <MessageCircle className="size-3.5" aria-hidden="true" />
                    <span className="tabular-nums">
                      {postcard.commentCount}
                    </span>
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`공유 ${postcard.shareCount}`}
                    title="공유"
                  >
                    <Share2 className="size-3.5" aria-hidden="true" />
                    <span className="tabular-nums">{postcard.shareCount}</span>
                  </span>
                </div>
              </div>
            </article>
          </Link>
        );
      })}

      <div ref={sentinelRef} className="flex min-h-px justify-center">
        {isFetchingNextPage && <span>더 불러오는 중...</span>}
      </div>
    </section>
  );
}
