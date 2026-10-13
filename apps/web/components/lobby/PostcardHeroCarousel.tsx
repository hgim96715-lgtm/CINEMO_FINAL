"use client";

import {useEffect, useState} from "react";
import {useInfiniteQuery} from "@tanstack/react-query";
import {postcardFeedQueryOptions} from "@/lib/queries/postcard-feed.query";
import Link from "next/link";
import Image from "next/image";

const AUTO_PLAY_INTERVAL = 6_000;

export function PostcardHeroCarousel() {
  const [activeIndex,setActiveIndex]=useState(0);
  const [isPaused,setIsPaused]=useState(false);
  const {data,isPending,isError}=useInfiniteQuery(postcardFeedQueryOptions());
  
  const postcards=data?.pages.flatMap((page)=>page.items)??[];
  
  const activePostcard=postcards[activeIndex];
  const activeImageUrl =
    activePostcard?.media[0]?.url ?? activePostcard?.movie?.posterUrl;
  const activeImageAlt =
    activePostcard?.media[0]?.altText ??
    `${activePostcard?.movie?.title ?? "영화"} 포스터`;
  
  // 배열이 새로 바뀌었을 때 현재 선택된 인덱스를 확인하고, 존재하지 않으면 0번 엽서로 초기화
  useEffect(()=>{
    if(activeIndex>=postcards.length){
      setActiveIndex(0);
    }
  },[activeIndex,postcards.length])
  
  useEffect(()=>{
    if(postcards.length<=1 || isPaused){
      return;
    }
    const timerId=window.setInterval(()=>{
      setActiveIndex((index)=>(index+1)%postcards.length);
    },AUTO_PLAY_INTERVAL)
    return () => {
      window.clearInterval(timerId);
    }
  },[isPaused,postcards.length])
  

  if(isPending){
    return (
        <section className="min-h-[clamp(22rem,42vw,28rem)] rounded-[2rem] bg-cinemo-surface/70" />
    )
  }
  if(isError||!activePostcard){
    return (
        <section className="flex min-h-[clamp(22rem,42vw,28rem)] items-center rounded-[2rem] bg-cinemo-surface px-8 py-12 sm:px-14">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.28em] text-primary">
              CINEMO POSTCARD
            </p>
            
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight text-cinemo-text sm:text-5xl">
              영화에 대한 마음을
              <br />
              한 장의 엽서에 남겨보세요.
            </h1>
            
            <Link
                href="/lobby/postcards"
                className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-cinemo-background"
            >
              엽서 둘러보기
            </Link>
          </div>
        </section>
    );
  }
  
  return (
    <section
      className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] text-cinemo-text shadow-[0_2rem_5rem_rgb(0_0_0_/24%)] backdrop-blur-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: activePostcard.backgroundStyle ?? undefined,
        }}
        aria-hidden
      />

      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,rgb(183_147_70_/18%),transparent_35%),linear-gradient(120deg,rgb(8_25_24_/96%)_0%,rgb(8_25_24_/82%)_58%,rgb(8_25_24_/58%)_100%)]"
        aria-hidden
      />

      <div className="relative z-10 grid min-h-0 gap-5 p-4 sm:min-h-[clamp(28rem,44vw,34rem)] sm:grid-cols-[minmax(0,1.1fr)_minmax(13rem,0.9fr)] sm:gap-10 sm:p-10 lg:p-14">
        <div className="order-2 flex min-w-0 flex-col justify-between sm:order-1">
          <div>
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <p className="text-xs tracking-[0.28em] text-cinemo-gold">
                CINEMO POSTCARD
              </p>
              <span className="rounded-full border border-cinemo-gold/40 bg-cinemo-gold/10 px-3 py-1 text-xs text-cinemo-gold sm:hidden">
                {activePostcard.type === "REVIEW"
                  ? "감상"
                  : activePostcard.type === "QUOTE"
                    ? "인용"
                    : activePostcard.type === "SCENE"
                      ? "장면"
                      : "기록"}
              </span>
            </div>

            <p className="mt-5 text-sm text-cinemo-muted sm:mt-8">
              {activePostcard.movie?.title ?? "영화와 함께 남긴 기록"}
            </p>

            <blockquote
              key={activePostcard.id}
              className="mt-3 max-w-2xl whitespace-pre-wrap font-serif text-[clamp(1.45rem,6.8vw,2rem)] font-semibold leading-[1.18] text-white sm:text-[clamp(1.8rem,4vw,3.8rem)]"
            >
              “{activePostcard.content}”
            </blockquote>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4 sm:mt-10 sm:gap-6">
            <div>
              <p className="text-sm text-cinemo-muted">
                영화와 함께 남긴 한 장의 기록
              </p>

              <Link
                href="/lobby/postcards"
                className="mt-4 inline-flex rounded-full bg-cinemo-gold px-5 py-3 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
              >
                엽서 둘러보기
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

        <div className="relative order-1 flex items-center justify-center sm:order-2">
          {activeImageUrl ? (
            <div className="relative aspect-[3/4] w-[min(42vw,11.5rem)] rotate-2 overflow-hidden rounded-[1.5rem] border border-white/20 bg-white/10 p-2 shadow-2xl shadow-black/40 transition-transform duration-500 hover:rotate-0 sm:w-[min(58vw,16rem)]">
              <div className="relative h-full overflow-hidden rounded-[1.1rem]">
                <Image
                  src={activeImageUrl}
                  alt={activeImageAlt}
                  fill
                  sizes="(max-width: 640px) 42vw, 256px"
                  className="object-cover"
                  priority
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10"
                  aria-hidden="true"
                />
              </div>
            </div>
          ) : (
            <div className="flex aspect-[3/4] w-[min(42vw,11.5rem)] items-center justify-center rounded-[1.5rem] border border-white/15 bg-white/5 text-sm text-cinemo-muted sm:w-[min(58vw,16rem)]">
              포스터 준비중
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
