"use client";

import {
  CalendarDays,
  Clapperboard,
  Heart,
  Popcorn,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { CurationHero, type CurationKind } from "./CurationHero";
import { HeroCarousel } from "./HeroCarousel";
import { TodayMovieHero } from "./TodayMovieHero";

type HeroTab = CurationKind | "postcard" | "today";

const tabs = [
  { value: "today", title: "오늘의 한 장면", caption: "나를 위한 추천", icon: Sparkles },
  { value: "commemorative", title: "필름 캘린더", caption: "오늘의 기념일", icon: CalendarDays },
  { value: "upcoming", title: "곧 만나요", caption: "개봉 전 설렘", icon: Clapperboard },
  { value: "platform", title: "소파 시네마", caption: "오늘 바로 보기", icon: Popcorn },
  { value: "postcard", title: "여운의 엽서", caption: "관객의 한 장면", icon: Heart },
] as const;

export function LobbyHeroTabs() {
  const [activeTab, setActiveTab] = useState<HeroTab>("today");

  return (
    <section
      aria-label="CINEMO 오늘의 영화 가이드"
      className="relative isolate overflow-hidden rounded-[2rem] border border-cinemo-gold/20 bg-[#071918] shadow-[0_2rem_5rem_rgb(0_0_0_/28%)]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgb(212_181_106_/15%),transparent_28%),radial-gradient(circle_at_90%_18%,rgb(83_174_157_/11%),transparent_26%)]" />
      <div className="relative px-5 pb-4 pt-7 sm:px-8 lg:px-12 lg:pt-10">
        <p className="text-xs font-medium tracking-[.34em] text-cinemo-gold">CINEMO NIGHT GUIDE</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-cinemo-text sm:text-4xl">오늘은 어떤 장면을 만나볼까?</h1>
        <p className="mt-2 text-sm text-cinemo-muted sm:text-base">영화의 순간을 골라, 나만의 다음 장면으로.</p>
      </div>
      <div aria-label="로비 탐색" className="relative flex gap-3 overflow-x-auto px-5 pb-6 pt-1 [scrollbar-width:none] sm:px-8 lg:px-12 [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ value, title, caption, icon: Icon }) => {
          const isActive = activeTab === value;
          return (
            <button key={value} type="button" aria-pressed={isActive} onClick={() => setActiveTab(value)} className={`group min-w-[10.25rem] shrink-0 rounded-2xl border px-4 py-3 text-left transition ${isActive ? "border-cinemo-gold/70 bg-cinemo-gold/10 shadow-[0_0_2rem_rgb(199_161_75_/10%)]" : "border-white/10 bg-white/[.03] hover:border-cinemo-gold/35 hover:bg-white/[.06]"}`}>
              <span className="mb-3 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/15"><Icon className={`size-4 ${isActive ? "text-cinemo-gold" : "text-cinemo-muted"}`} /></span>
              <span className="block text-sm font-semibold text-cinemo-text">{title}</span>
              <span className="mt-1 block text-xs text-cinemo-muted">{caption}</span>
            </button>
          );
        })}
      </div>
      <div className="relative border-t border-white/10">
        {activeTab === "today" ? <TodayMovieHero embedded /> : activeTab === "postcard" ? <HeroCarousel embedded /> : <CurationHero activeKind={activeTab} showKindTabs={false} embedded />}
      </div>
    </section>
  );
}
