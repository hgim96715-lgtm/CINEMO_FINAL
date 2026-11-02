"use client";

import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  PLATFORM_PROVIDERS,
  TMDB_IMAGE_BASE_URL,
  usePlatformMovies,
} from "@/components/lobby/PlatformMovieCollection";
import type { ViewingPlatform } from "@/lib/api/movies";

export default function PlatformMoviesPage() {
  const [selectedProvider, setSelectedProvider] =
    useState<ViewingPlatform | "ALL">("ALL");
  const { movies, isPending, isError } = usePlatformMovies(100, {
    limitTotal: false,
  });
  const filteredMovies =
    selectedProvider === "ALL"
      ? movies
      : movies.filter(({ providers }) =>
          providers.some((provider) => provider.provider === selectedProvider),
        );

  return (
    <main className="mx-auto w-full max-w-[120rem] px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      <Link
        href="/lobby"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
      >
        <ChevronLeft className="size-4" />
        로비로 돌아가기
      </Link>

      <div className="mb-10">
        <p className="mb-2 text-xs tracking-[0.24em] text-primary">
          WATCH ANYWHERE
        </p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          플랫폼에서 볼 수 있는 영화
        </h1>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedProvider("ALL")}
          className={`shrink-0 rounded-xl border px-4 py-2 text-sm transition ${
            selectedProvider === "ALL"
              ? "border-cinemo-gold/60 bg-cinemo-gold/15 text-cinemo-gold-light"
              : "border-white/20 bg-white/5 text-cinemo-muted hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light"
          }`}
        >
          전체
        </button>

        {PLATFORM_PROVIDERS.map(({ provider, label }) => (
          <button
            key={provider}
            type="button"
            onClick={() => setSelectedProvider(provider)}
            className={`shrink-0 rounded-xl border px-4 py-2 text-sm transition ${
              selectedProvider === provider
                ? "border-cinemo-gold/60 bg-cinemo-gold/15 text-cinemo-gold-light"
                : "border-white/20 bg-white/5 text-cinemo-muted hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="py-20 text-center text-muted-foreground">
          플랫폼 영화를 불러오는 중...
        </p>
      ) : isError ? (
        <p className="py-20 text-center text-cinemo-red">
          플랫폼 영화를 불러오지 못했습니다.
        </p>
      ) : filteredMovies.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          해당 플랫폼의 영화가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
          {filteredMovies.map(({ movie, providers }) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.id}`}
              className="group block"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-card">
                <Image
                  src={movie.posterUrl!}
                  alt={`${movie.title} 포스터`}
                  fill
                  sizes="(min-width: 1024px) 180px, (min-width: 640px) 22vw, 45vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1.5">
                  {providers.map((provider) =>
                    provider.logoPath ? (
                      <Image
                        key={provider.provider}
                        src={`${TMDB_IMAGE_BASE_URL}${provider.logoPath}`}
                        alt={provider.label}
                        width={40}
                        height={40}
                        className="size-8 rounded-lg object-contain shadow-lg"
                      />
                    ) : (
                      <span
                        key={provider.provider}
                        className="rounded-lg bg-black/70 px-2 py-1 text-[10px] font-semibold text-white"
                      >
                        {provider.label}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <h2 className="mt-3 truncate text-sm font-medium text-foreground">
                {movie.title}
              </h2>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {providers.map((provider) => provider.label).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
