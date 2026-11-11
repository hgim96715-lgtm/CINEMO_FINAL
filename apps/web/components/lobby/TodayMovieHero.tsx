"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { apiClient } from "@/lib/api/apiClient";
import { authMeQueryOptions } from "@/lib/queries/auth.query";

type TodayMovie = {
  headline?: string;
  weatherSource?: string | null;
  movie: { id: string; title: string; posterUrl: string };
  reason: string;
};

async function loadRecommendation(signedIn: boolean, signal: AbortSignal): Promise<TodayMovie | null> {
  if (signedIn) {
    try {
      return (await apiClient.get<TodayMovie | null>("/daily-movie", { signal })).data;
    } catch (error) {
      if (!isAxiosError(error) || error.response?.status !== 401) throw error;
    }
  }

  const response = await fetch("/api/v1/daily-movie", { credentials: "omit", signal });
  if (!response.ok) throw new Error("추천을 불러오지 못했어요.");
  return response.json();
}

const recommendationCardClass =
  "flex min-h-[210px] items-center gap-4 rounded-3xl border border-cinemo-gold/25 bg-white/5 p-4 sm:min-h-[274px] sm:gap-8 sm:p-7";
const recommendationPosterClass = "aspect-[2/3] w-24 shrink-0 rounded-xl sm:w-36";

export function TodayMovieHero() {
  const viewer = useQuery(authMeQueryOptions());
  const recommendation = useQuery({
    queryKey: ["lobby", "daily-movie", viewer.data?.id ?? "guest"],
    enabled: !viewer.isPending,
    queryFn: ({ signal }) => loadRecommendation(Boolean(viewer.data?.id), signal),
    staleTime: 60_000,
    retry: false,
  });
  const { headline, movie, reason, weatherSource } = recommendation.data ?? {};
  return (
    <section aria-labelledby="today-movie-heading" className="my-8 sm:my-10">
      <h2 id="today-movie-heading" className="mb-4 text-xl font-bold text-cinemo-gold-light">오늘의 영화</h2>
      {movie && <Link
        href={`/movies/${movie.id}`}
        className={`${recommendationCardClass} transition-colors hover:border-cinemo-gold/60`}
      >
        <Image src={movie.posterUrl} alt="" width={144} height={216} sizes="(min-width: 640px) 144px, 96px" className={`${recommendationPosterClass} object-cover`} />
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-cinemo-gold-light">{headline ?? "🎬 오늘 추천하는 한 편"}</p>
          <h3 className="text-2xl font-bold sm:text-4xl">{movie.title}</h3>
          <p className="text-sm text-cinemo-muted"><span className="mr-2 font-semibold text-cinemo-gold-light">추천 이유</span>{reason}</p>
          {weatherSource && <p className="text-xs text-cinemo-muted">{weatherSource}</p>}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-cinemo-gold-light">
            영화 상세 보기 <ArrowUpRight size={15} aria-hidden />
          </span>
        </div>
      </Link>}
      {!movie && (
        <div className={`${recommendationCardClass} relative overflow-hidden text-sm text-cinemo-muted`} role="status">
          {recommendation.isPending && <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_74%_42%,rgb(212_181_106_/10%),transparent_30%)]" />}
          <div aria-hidden="true" className={`${recommendationPosterClass} cinemo-skeleton relative flex items-center justify-center overflow-hidden border border-white/8`}>
            {recommendation.isPending && (
              <div className="cinemo-loading-orbit size-9 rounded-full border-2 border-cinemo-gold/25 border-t-cinemo-gold" />
            )}
          </div>
          {recommendation.isPending ? (
            <div className="relative min-w-0 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-cinemo-gold-light">
                <Sparkles className="size-4" aria-hidden />
                오늘의 장면을 고르는 중
              </div>
              <div aria-hidden className="cinemo-skeleton h-8 w-44 max-w-full rounded-full sm:h-10 sm:w-64" />
              <div aria-hidden className="space-y-2">
                <div className="cinemo-skeleton h-3 w-52 max-w-full rounded-full" />
                <div className="cinemo-skeleton h-3 w-36 rounded-full" />
              </div>
              <p className="text-xs text-cinemo-muted">오늘의 분위기와 영화 기록을 바탕으로 한 편을 준비하고 있어요.</p>
            </div>
          ) : recommendation.isError ? (
            <div>
              추천을 불러오지 못했어요.
              <button type="button" className="ml-3 font-semibold text-cinemo-gold-light" onClick={() => void recommendation.refetch()}>
                다시 시도
              </button>
            </div>
          ) : "지금 추천할 영화가 없어요."}
        </div>
      )}
    </section>
  );
}
