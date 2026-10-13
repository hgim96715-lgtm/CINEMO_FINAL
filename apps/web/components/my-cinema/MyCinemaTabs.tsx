"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { BookmarkedPeopleList } from "./BookmarkedPeopleList";
import { MovieNotificationsList } from "./MovieNotificationsList";
import { MyMoviesList } from "./MyMoviesList";
import { MyPostcardsPanel } from "@/components/postcard/MyPostcardsPanel";

type MyCinemaTab = "movies" | "people" | "notifications" | "postcards";

const tabs: Array<{ id: MyCinemaTab; label: string }> = [
  { id: "movies", label: "내 영화" },
  { id: "people", label: "저장한 인물" },
  { id: "notifications", label: "알림" },
  { id: "postcards", label: "내 엽서" },
];

export function MyCinemaTabs() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<MyCinemaTab>("movies");

  useEffect(() => {
    const isValidTab = tabs.some((tab) => tab.id === requestedTab);

    if (isValidTab) {
      setActiveTab(requestedTab as MyCinemaTab);
    }
  }, [requestedTab]);

  return (
    <section className="mt-8">
      <div
        role="tablist"
        aria-label="MY CINEMA 메뉴"
        className="flex overflow-x-auto rounded-2xl border border-white/10 bg-white/3 p-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
        {activeTab === "movies" && <MyMoviesList />}

        {activeTab === "people" && <BookmarkedPeopleList />}

        {activeTab === "notifications" && <MovieNotificationsList />}

        {activeTab === "postcards" && <MyPostcardsPanel />}
      </div>
    </section>
  );
}
