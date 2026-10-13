"use client";

import Link from "next/link";
import Image from "next/image";
import {useParams} from "next/navigation";
import {useQuery} from "@tanstack/react-query";

import {postcardDetailQueryOptions} from "@/lib/queries/postcard-detail.query";
import {ArrowLeft} from "lucide-react";

export default function PostcardDetailPage() {
  const { id } = useParams<{ id: string }>();
  
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
  
  const postcard = postcardQuery.data;
  const imageUrl = postcard.media[0]?.url ?? postcard.movie?.posterUrl;
  const imageAlt =
    postcard.media[0]?.altText ?? `${postcard.movie?.title ?? "영화"} 포스터`;
  const typeLabel =
    postcard.type === "REVIEW"
      ? "감상"
      : postcard.type === "QUOTE"
        ? "인용"
        : postcard.type === "SCENE"
          ? "장면"
          : "기록";
  
  return (
      <main className="min-h-screen bg-[#071619] px-4 py-6 text-white sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <Link
              href="/lobby/postcards"
              className="inline-flex items-center gap-2 text-sm text-cinemo-muted transition hover:text-cinemo-gold-light"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> 공개 엽서
          </Link>
          
          <article
              className="relative mt-6 border-b border-white/15 pb-8 sm:mt-8 sm:pb-10"
          >
            <div className="relative p-5 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="whitespace-nowrap text-[10px] tracking-[0.16em] text-cinemo-gold-light sm:text-xs sm:tracking-[0.2em]">
                    CINEMO POSTCARD
                  </p>

                  {postcard.movie?.title && (
                    <p className="mt-4 truncate text-sm text-cinemo-muted">
                      {postcard.movie.title}
                    </p>
                  )}
                </div>

                {imageUrl && (
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-black/20 shadow-lg sm:h-24 sm:w-16">
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      fill
                      sizes="64px"
                      className="object-cover"
                      priority
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="rounded-full border border-cinemo-gold/40 bg-cinemo-gold/10 px-3 py-1 text-xs text-cinemo-gold-light">
                  {typeLabel}
                </span>
              </div>

              <blockquote className="mt-4 whitespace-pre-wrap font-serif text-[clamp(1.5rem,6vw,2.5rem)] font-semibold leading-[1.25] text-white sm:mt-5 sm:text-3xl sm:leading-[1.4]">
                “{postcard.content}”
              </blockquote>

              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/60 sm:mt-7">
                <span>반응 {postcard.reactionCount}</span>
                <span>댓글 {postcard.commentCount}</span>
                <span>공유 {postcard.shareCount}</span>
              </div>
            </div>
          </article>

        </div>
      </main>
  );
}
