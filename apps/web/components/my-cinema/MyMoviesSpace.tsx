"use client";

import { useState } from "react";

import { MovieCalendar } from "./MovieCalendar";
import { MovieSpaceDrawer, type MovieSpaceTab } from "./MovieSpaceDrawer";
import { MyMoviesList } from "./MyMoviesList";

export function MyMoviesSpace() {
  const [activeTab, setActiveTab] = useState<MovieSpaceTab>("saved");

  return (
    <section className="space-y-5">
      <MovieSpaceDrawer activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "calendar" && <MovieCalendar />}

      {activeTab === "saved" && <MyMoviesList />}

      {activeTab === "watched" && (
        <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-cinemo-muted">
          관람 기록 목록
        </div>
      )}
    </section>
  );
}
