"use client";

import { useState } from "react";

import { CurationHero, type CurationKind } from "./CurationHero";
import { HeroCarousel } from "./HeroCarousel";

type HeroTab = CurationKind | "postcard";

const tabs: Array<{ value: HeroTab; label: string }> = [
  { value: "commemorative", label: "기념일" },
  { value: "upcoming", label: "개봉 예정" },
  { value: "platform", label: "플랫폼" },
  { value: "postcard", label: "엽서" },
];

export function LobbyHeroTabs() {
  const [activeTab, setActiveTab] = useState<HeroTab>("commemorative");

  return (
    <section
      aria-label="CINEMO 로비 Hero"
      className="overflow-hidden rounded-[2rem] bg-[#081918] shadow-[0_2rem_5rem_rgb(0_0_0_/28%)]"
    >
      <div className="flex gap-6 overflow-x-auto border-b border-white/10 px-5 pt-5 scrollbar-none sm:px-10 sm:pt-7 [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`shrink-0 select-none border-b-2 pb-3 text-sm transition ${
              activeTab === tab.value
                ? "border-cinemo-gold font-semibold text-cinemo-gold"
                : "border-transparent text-cinemo-muted hover:border-cinemo-gold/60 hover:text-cinemo-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "postcard" ? (
        <HeroCarousel embedded />
      ) : (
        <CurationHero activeKind={activeTab} showKindTabs={false} embedded />
      )}
    </section>
  );
}
