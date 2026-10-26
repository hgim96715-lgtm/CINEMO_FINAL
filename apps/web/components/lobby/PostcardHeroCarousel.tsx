"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { postcardFeedQueryOptions } from "@/lib/queries/postcard-feed.query";
import Link from "next/link";
import Image from "next/image";
import { PostcardSceneMeta } from "@/components/postcard/PostcardSceneMeta";
import { PostcardQuoteContent } from "@/components/postcard/PostcardQuoteContent";
import { ArrowUpRight } from "lucide-react";

const AUTO_PLAY_INTERVAL = 6_000;

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

export function PostcardHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { data, isPending, isError } = useInfiniteQuery(
    postcardFeedQueryOptions(),
  );

  const postcards = data?.pages.flatMap((page) => page.items) ?? [];

  const activePostcard = postcards[activeIndex];
  const activeImageUrl =
    activePostcard?.movie?.posterUrl ?? activePostcard?.media[0]?.url;
  const activeImageAlt =
    activePostcard?.media[0]?.altText ??
    `${activePostcard?.movie?.title ?? "영화"} 포스터`;
  const activeTranslation =
    activePostcard?.metadata?.type === "QUOTE"
      ? (activePostcard.metadata.translations?.find(
          (translation) => translation.language.toLowerCase() === "ko",
        )?.content ?? "")
      : "";
  const hasMoreContent = activePostcard
    ? activePostcard.type === "QUOTE"
      ? activePostcard.content.length > 90 ||
        activeTranslation.length > 90 ||
        activeTranslation.split(/\r?\n/).length > 3
      : activePostcard.content.length > 160
    : false;

  // 배열이 새로 바뀌었을 때 현재 선택된 인덱스를 확인하고, 존재하지 않으면 0번 엽서로 초기화
  useEffect(() => {
    if (activeIndex >= postcards.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, postcards.length]);

  useEffect(() => {
    if (postcards.length <= 1 || isPaused) {
      return;
    }
    const timerId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % postcards.length);
    }, AUTO_PLAY_INTERVAL);
    return () => {
      window.clearInterval(timerId);
    };
  }, [isPaused, postcards.length]);

  if (isPending) {
    return (
      <section className="min-h-[clamp(22rem,42vw,28rem)] rounded-[2rem] bg-cinemo-surface/70" />
    );
  }
  if (isError || !activePostcard) {
    return (
      <section className="flex min-h-[clamp(22rem,42vw,28rem)] items-center rounded-[2rem] bg-cinemo-surface px-8 py-12 sm:px-14">
        <div className="max-w-xl">
          <p className="text-xs tracking-[0.28em] text-primary">
            CINEMO POSTCARD
          </p>

          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight text-cinemo-text sm:text-5xl">
            영화에 대한 마음을
            <br />한 장의 엽서에 남겨보세요.
          </h1>

          <Link
            href="/lobby/postcards"
            className="mt-8 inline-flex items-center rounded-lg border border-cinemo-gold/40 bg-cinemo-gold/10 px-3.5 py-2 text-xs font-medium text-cinemo-gold transition hover:border-cinemo-gold/70 hover:bg-cinemo-gold/15"
          >
            엽서 둘러보기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative isolate mx-1 mt-5 min-h-77.5 overflow-hidden rounded-3xl border border-white/10 bg-white/6 text-cinemo-text shadow-[0_2rem_5rem_rgb(0_0_0_/24%)] backdrop-blur-xl sm:mx-0 sm:mt-0 sm:h-[clamp(28rem,44vw,34rem)] sm:rounded-[2rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(120deg,rgb(8_25_24_/96%)_0%,rgb(8_25_24_/88%)_58%,rgb(8_25_24_/78%)_100%)]"
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col gap-4 p-5 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)] sm:grid-rows-1 sm:gap-10 sm:p-10 lg:p-14">
        <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col justify-between overflow-hidden sm:order-1 sm:justify-between">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-hidden">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <p className="text-xs tracking-[0.08em] text-cinemo-muted">
                  {formatPostcardDate(activePostcard.createdAt)} ·{" "}
                  {activePostcard.author?.nickname ?? "익명"}
                </p>
                <span className="rounded-full border border-cinemo-gold/40 bg-cinemo-gold/10 px-3 py-1 text-xs text-cinemo-gold sm:hidden">
                  {activePostcard.type === "REVIEW"
                    ? "감상"
                    : activePostcard.type === "QUOTE"
                      ? "인용"
                      : activePostcard.type === "SCENE"
                        ? "장면"
                        : "감상"}
                </span>
              </div>

              <div className="mt-5 flex min-h-0 items-end gap-4 sm:mt-5 sm:block">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-cinemo-gold drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)]">
                    {activePostcard.movie?.title ?? "영화와 함께 남긴 기록"}
                  </p>

                  {activePostcard.type === "SCENE" && (
                    <PostcardSceneMeta
                      metadata={activePostcard.metadata}
                      compact
                    />
                  )}

                  {activePostcard.type === "QUOTE" ? (
                    <PostcardQuoteContent
                      content={activePostcard.content}
                      metadata={activePostcard.metadata}
                      compact
                      compactQuoteLines={3}
                      compactTranslationLines={2}
                      className="mt-3 min-h-30 max-w-2xl overflow-hidden font-serif text-[clamp(1.25rem,5vw,1.35rem)] font-semibold leading-[1.2] text-white sm:h-60 sm:text-[clamp(1.7rem,3.5vw,2.8rem)]"
                    />
                  ) : (
                    <blockquote
                      key={activePostcard.id}
                      className="mt-3 min-h-30 max-w-2xl line-clamp-3 overflow-hidden whitespace-pre-wrap font-serif text-[clamp(1.25rem,5vw,1.35rem)] font-semibold leading-[1.2] text-white sm:h-44 sm:text-[clamp(1.8rem,4vw,3.2rem)]"
                    >
                      “{activePostcard.content}”
                    </blockquote>
                  )}
                </div>

                {activeImageUrl && (
                  <div className="relative h-33 w-22 shrink-0 overflow-hidden rounded-[14px] bg-cinemo-surface sm:hidden">
                    <Image
                      src={activeImageUrl}
                      alt={activeImageAlt}
                      fill
                      sizes="88px"
                      className="object-contain"
                      priority
                    />
                  </div>
                )}
              </div>
            </div>

            {hasMoreContent && (
              <Link
                href={`/lobby/postcards/${activePostcard.id}`}
                className="mt-2 inline-flex shrink-0 text-sm font-medium text-cinemo-gold transition hover:text-cinemo-gold-light"
              >
                더보기
              </Link>
            )}
          </div>

          <div className="mt-4 flex shrink-0 items-end justify-between gap-4 sm:mt-6 sm:gap-6">
            <div>
              <Link
                href="/lobby/postcards"
                className="mt-4 inline-flex items-center rounded-lg border  bg-cinemo-gold/10 px-3.5 py-2 text-xs font-medium text-cinemo-gold transition hover:border-cinemo-gold/70 hover:bg-cinemo-gold/15"
              >
                엽서 둘러보기
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {postcards.map((postcard, index) => (
                <button
                  key={postcard.id}
                  type="button"
                  aria-label={`${index + 1}번째 엽서 보기`}
                  aria-current={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeIndex
                      ? "w-8 bg-cinemo-gold"
                      : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative order-1 hidden w-full items-center justify-center sm:order-2 sm:flex">
          {activeImageUrl ? (
            <div className="relative flex h-full w-full items-center justify-center">
              <div className="relative aspect-2/3 h-full max-h-full w-auto max-w-full rotate-1 overflow-hidden rounded-[1.75rem] transition-transform duration-500 hover:rotate-0">
                <Image
                  src={activeImageUrl}
                  alt={activeImageAlt}
                  fill
                  sizes="(max-width: 1024px) 44vw, 520px"
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full max-w-lg items-center justify-center text-sm text-cinemo-muted">
              포스터 준비중
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
