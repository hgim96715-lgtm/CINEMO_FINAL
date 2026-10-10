"use client";

import { useState } from "react";

import { MovieSpaceDrawer } from "./MovieSpaceDrawer";
import { MyMoviesList } from "./MyMoviesList";

type MovieSpaceTab = "saved" | "watched" | "postcards";

export function MyMoviesSpace() {
    const [activeTab, setActiveTab] =
        useState<MovieSpaceTab>("saved");

    return (
        <section className="space-y-5">
            <MovieSpaceDrawer
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {activeTab === "saved" && <MyMoviesList />}

            {activeTab === "watched" && (
                <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-cinemo-muted">
                    본 영화 목록
                </div>
            )}

            {activeTab === "postcards" && (
                <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-cinemo-muted">
                    작성한 엽서 목록
                </div>
            )}
        </section>
    );
}
