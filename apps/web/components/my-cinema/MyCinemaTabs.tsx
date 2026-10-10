"use client";

import type { ComponentType } from "react";
import { useState } from "react";

import { BookmarkedPeopleList } from "./BookmarkedPeopleList";
import { MovieNotificationsList } from "./MovieNotificationsList";
import { MyMoviesList } from "./MyMoviesList";

type MyCinemaTab = "movies" | "people" | "notifications";

const panelMap: Record<MyCinemaTab, ComponentType> = {
  movies: MyMoviesList,
  people: BookmarkedPeopleList,
  notifications: MovieNotificationsList,
};

const tabs: Array<{ id: MyCinemaTab; label: string }> = [
  { id: "movies", label: "내 영화" },
  { id: "people", label: "저장한 인물" },
  { id: "notifications", label: "알림" },
];

export function MyCinemaTabs() {
  const [activeTab, setActiveTab] = useState<MyCinemaTab>("movies");
  const Panel = panelMap[activeTab];

  return (
    <section className="mt-8">
      <div
        role="tablist"
        aria-label="MY CINEMA 메뉴"
        className="flex overflow-x-auto rounded-2xl border border-white/10 bg-white/3 p-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-white/10 text-cinemo-gold-light"
                  : "text-cinemo-muted hover:bg-white/5 hover:text-cinemo-text"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 min-h-36 text-sm text-cinemo-muted">
        <Panel />
      </div>
    </section>
  );
}
