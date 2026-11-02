"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

import { AdminNavigation } from "@/components/admin/AdminNavigation";
import {
  updateAdminMovieVisibility,
  type AdminMovie,
  type AdminMovieVisibility,
} from "@/lib/api/admin-movies";
import { adminMoviesQueryOptions } from "@/lib/queries/admin-movies.query";

const VISIBILITY_OPTIONS: Array<{
  value: AdminMovieVisibility;
  label: string;
}> = [
  { value: "PUBLIC", label: "공개" },
  { value: "REVIEW", label: "검토" },
  { value: "HIDDEN", label: "숨김" },
];

export function AdminMovieSearch() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [visibility, setVisibility] =
    useState<AdminMovieVisibility>("PUBLIC");
  const queryClient = useQueryClient();

  const moviesQuery = useQuery(
    adminMoviesQueryOptions({
      query: submittedQuery,
      visibility,
    }),
  );

  const visibilityMutation = useMutation({
    mutationFn: updateAdminMovieVisibility,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "movies"] });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-11rem)] max-w-6xl px-6 py-12 sm:py-16">
      <AdminNavigation />

      <header className="mb-8">
        <p className="text-sm font-semibold tracking-[0.32em] text-cinemo-gold">
          ADMIN MOVIES
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-cinemo-text sm:text-4xl">
          영화 검색
        </h1>
        <p className="mt-3 text-sm text-cinemo-muted">
          외국어 제목과 UUID까지 검색하고 영화 공개 상태를 관리
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex max-w-4xl flex-wrap gap-3">
        <label className="relative block min-w-[16rem] flex-1">
          <span className="sr-only">영화 제목 또는 UUID</span>
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-cinemo-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="영화 제목 또는 UUID를 입력하세요"
            className="h-12 w-full rounded-xl border border-white/10 bg-[#101f21] pl-12 pr-4 text-sm text-cinemo-text outline-none transition placeholder:text-cinemo-muted focus:border-cinemo-gold/60"
          />
        </label>
        <select
          value={visibility}
          onChange={(event) =>
            setVisibility(event.target.value as AdminMovieVisibility)
          }
          className="h-12 rounded-xl border border-white/10 bg-[#101f21] px-4 text-sm text-cinemo-text outline-none focus:border-cinemo-gold/60"
          aria-label="공개 상태"
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-12 rounded-xl bg-cinemo-gold px-5 text-sm font-semibold text-cinemo-dark transition hover:bg-cinemo-gold-light"
        >
          검색
        </button>
      </form>

      {moviesQuery.isPending && (
        <p className="mt-8 text-sm text-cinemo-muted">영화를 검색하는 중...</p>
      )}

      {moviesQuery.isError && (
        <p className="mt-8 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          영화 검색 결과를 불러오지 못했습니다.
        </p>
      )}

      {moviesQuery.data && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-cinemo-text">
              검색 결과
            </h2>
            <span className="text-sm text-cinemo-muted">
              {moviesQuery.data.totalCount.toLocaleString("ko-KR")}건
            </span>
          </div>

          {moviesQuery.data.items.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-[#101f21] px-5 py-8 text-center text-sm text-cinemo-muted">
              검색 결과가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {moviesQuery.data.items.map((movie) => (
                <AdminMovieSearchItem
                  key={movie.id}
                  movie={movie}
                  isUpdating={visibilityMutation.isPending}
                  onVisibilityChange={(nextVisibility) =>
                    visibilityMutation.mutate({
                      movieId: movie.id,
                      visibility: nextVisibility,
                      moderationReason:
                        nextVisibility === "HIDDEN"
                          ? "관리자 검토: 한국어 제목 없음"
                          : null,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function AdminMovieSearchItem({
  movie,
  isUpdating,
  onVisibilityChange,
}: {
  movie: AdminMovie;
  isUpdating: boolean;
  onVisibilityChange: (visibility: AdminMovieVisibility) => void;
}) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(movie.id);
  };

  return (
    <article className="flex flex-wrap gap-4 rounded-2xl border border-white/10 bg-[#101f21] p-4 sm:items-center">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-white/5 sm:size-24">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`${movie.title} 포스터`}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-xs text-cinemo-muted">
            포스터 없음
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="break-words font-semibold text-cinemo-text">
          {movie.title || "제목 없음"}
        </h3>
        <p className="mt-1 text-xs text-cinemo-muted">
          {movie.releaseDate ?? "개봉일 미정"} · {movie.visibility}
        </p>
        <p className="mt-3 break-all font-mono text-xs text-cinemo-gold-light">
          {movie.id}
        </p>
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-cinemo-gold/25 px-3 py-2 text-xs text-cinemo-gold-light transition hover:bg-cinemo-gold/10"
        >
          UUID 복사
        </button>
        <select
          value={movie.visibility}
          disabled={isUpdating}
          onChange={(event) =>
            onVisibilityChange(event.target.value as AdminMovieVisibility)
          }
          className="rounded-lg border border-white/10 bg-[#0a191a] px-3 py-2 text-xs text-cinemo-text outline-none focus:border-cinemo-gold/60 disabled:opacity-50"
          aria-label={`${movie.title} 공개 상태`}
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}
