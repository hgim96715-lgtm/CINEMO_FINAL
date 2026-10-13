"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

import { PostcardMoviePicker } from "@/components/postcard/PostcardMoviePicker";
import { myPostcardsQueryOptions } from "@/lib/queries/postcard-feed.query";
import { Plus } from "lucide-react";

const postcardTypeLabels = {
  REVIEW: "감상",
  QUOTE: "인용",
  SCENE: "장면",
  NOTE: "기록",
} as const;

export function MyPostcardsPanel() {
  const router = useRouter();
  const [moviePickerOpen, setMoviePickerOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(myPostcardsQueryOptions());

  const postcards = data?.pages.flatMap((page) => page.items) ?? [];

  const openPostcardCreate = (movieId?: string) => {
    if (movieId) {
      router.push(
        `/my-cinema/postcards/new?movieId=${encodeURIComponent(movieId)}`,
      );
      return;
    }

    setMoviePickerOpen(true);
  };

  if (isLoading) {
    return <p>내 엽서를 불러오는 중...</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400">내 엽서를 불러오지 못했습니다.</p>
    );
  }

  return (
    <>
      <section className="space-y-4">
        {postcards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-10 text-center">
            <p className="text-sm text-cinemo-muted">
              아직 만든 엽서가 없습니다.
            </p>

            <button
              type="button"
              onClick={() => openPostcardCreate()}
              className="mt-6 rounded-xl bg-cinemo-gold px-5 py-3 text-sm font-semibold text-cinemo-bg"
            >
              첫 엽서 만들기
            </button>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between px-5">
              <h2 className="text-lg font-semibold text-cinemo-text">
                내 엽서
              </h2>

              <button
                type="button"
                onClick={() => openPostcardCreate()}
                className="flex items-center rounded-xl bg-cinemo-gold px-4 py-2 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light "
              >
                <Plus width={20} height={20} aria-hidden={true} /> 엽서
              </button>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              {postcards.map((postcard) => {
                const imageUrl =
                  postcard.media[0]?.url ?? postcard.movie?.posterUrl;
                const imageAlt =
                  postcard.media[0]?.altText ??
                  `${postcard.movie?.title ?? "영화"} 포스터`;

                return (
                  <article
                    key={postcard.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl"
                  >
                    <div className="flex min-h-36 gap-4 p-3">
                      <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-[#172322]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={imageAlt}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-white/45">
                            포스터 없음
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 py-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-cinemo-gold">
                            {postcardTypeLabels[postcard.type]}
                          </span>

                          <span className="shrink-0 text-xs text-cinemo-muted">
                            {postcard.status === "DRAFT"
                              ? "임시저장"
                              : postcard.visibility === "PUBLIC"
                                ? "공개"
                                : postcard.visibility === "UNLISTED"
                                  ? "링크 공개"
                                  : "비공개"}
                          </span>
                        </div>

                        <p className="mt-2 truncate text-sm font-semibold text-cinemo-text">
                          {postcard.movie?.title ?? "영화 정보 없음"}
                        </p>

                        <p className="mt-2 line-clamp-3 text-sm leading-6 whitespace-pre-wrap text-cinemo-muted">
                          {postcard.content}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full rounded-xl border border-white/15 px-4 py-3 text-sm text-cinemo-muted transition hover:bg-white/5 disabled:opacity-50"
          >
            {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
          </button>
        )}
      </section>

      <PostcardMoviePicker
        open={moviePickerOpen}
        onOpenChange={setMoviePickerOpen}
        onSelect={(movieId) => {
          openPostcardCreate(movieId);
        }}
      />
    </>
  );
}
