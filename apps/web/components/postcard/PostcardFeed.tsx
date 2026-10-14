"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
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
        const imageUrl = postcard.media[0]?.url ?? postcard.movie?.posterUrl;
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
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-[#172322] min-[480px]:aspect-[16/7] sm:h-40 sm:aspect-auto sm:w-28">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      fill
                      sizes="112px"
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-white/50">
                      포스터 없음
                    </div>
                  )}

                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent sm:hidden"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-x-4 bottom-4 sm:hidden">
                    <p className="text-xs tracking-[0.12em] text-white/75">
                      {postcardTypeDescriptions[postcard.type]}
                    </p>
                    <h2 className="mt-1 truncate text-xl font-semibold text-white">
                      {postcard.movie?.title ?? "영화 정보 없음"}
                    </h2>
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center justify-between gap-3 sm:hidden">
                    <span className="text-[10px] font-medium tracking-[0.08em] text-white/55">
                      {formatPostcardDate(postcard.createdAt)} ·{" "}
                      {postcard.author?.nickname ?? "익명"}
                    </span>
                    <span className="rounded-full bg-cinemo-gold px-2.5 py-1 text-xs font-semibold text-cinemo-bg">
                      {postcardTypeLabels[postcard.type]}
                    </span>
                  </div>

                  <div className="hidden items-start justify-between gap-3 sm:flex">
                    <div className="min-w-0">
                      <p className="truncate text-xs tracking-[0.08em] text-white/55">
                        {formatPostcardDate(postcard.createdAt)} ·{" "}
                        {postcard.author?.nickname ?? "익명"}
                      </p>
                      <h2 className="mt-1 truncate text-lg font-semibold text-white">
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
                      className="mt-2 line-clamp-4 text-sm leading-6 text-white/90"
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
                <div className="flex items-center gap-3">
                  <span>반응 {postcard.reactionCount}</span>
                  <span>댓글 {postcard.commentCount}</span>
                  <span>공유 {postcard.shareCount}</span>
                </div>
              </div>
            </article>
          </Link>
        );
      })}

      <div ref={sentinelRef} className="flex justify-center py-6">
        {isFetchingNextPage && <span>더 불러오는 중...</span>}
        {!hasNextPage && <span>모든 엽서를 불러왔습니다.</span>}
      </div>
    </section>
  );
}
