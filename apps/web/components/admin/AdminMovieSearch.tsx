"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { Building2, CalendarPlus, ChevronDown, Search } from "lucide-react";

import { AdminNavigation } from "@/components/admin/AdminNavigation";
import {
  updateAdminMovieVisibility,
  createAdminMovieRerelease,
  updateAdminMovieRereleaseFormat,
  type AdminMovie,
  type AdminMovieVisibility,
  type AdminMovieVisibilityFilter,
  type TheaterExclusive,
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

const THEATER_EXCLUSIVE_OPTIONS: Array<{
  value: TheaterExclusive | "";
  label: string;
}> = [
  { value: "", label: "일반 개봉" },
  { value: "CGV", label: "CGV 단독 개봉" },
  { value: "MEGABOX", label: "메가박스 단독 개봉" },
  { value: "LOTTE_CINEMA", label: "롯데시네마 단독 개봉" },
];

function getTheaterExclusiveLabel(value: TheaterExclusive | null) {
  return (
    THEATER_EXCLUSIVE_OPTIONS.find((option) => option.value === value)?.label ??
    null
  );
}

export function AdminMovieSearch() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [visibility, setVisibility] =
    useState<AdminMovieVisibilityFilter>("ALL");
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
  const rereleaseMutation = useMutation({
    mutationFn: createAdminMovieRerelease,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "movies"] });
    },
  });
  const rereleaseFormatMutation = useMutation({
    mutationFn: updateAdminMovieRereleaseFormat,
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

      <form
        onSubmit={handleSubmit}
        className="flex max-w-4xl flex-wrap items-center gap-3"
      >
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">영화 제목 또는 UUID</span>
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-cinemo-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목 일부 또는 UUID 입력"
            className="h-12 w-full rounded-xl border border-white/10 bg-[#101f21] pl-12 pr-4 text-sm text-cinemo-text outline-none transition placeholder:text-cinemo-muted focus:border-cinemo-gold/60"
          />
        </label>
        <div
          role="group"
          aria-label="공개 상태 필터"
          className="order-last flex w-full flex-wrap gap-2"
        >
          {(
            [{ value: "ALL", label: "전체" }, ...VISIBILITY_OPTIONS] satisfies {
              value: AdminMovieVisibilityFilter;
              label: string;
            }[]
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={visibility === option.value}
              onClick={() => setVisibility(option.value)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-cinemo-muted aria-pressed:border-cinemo-gold/50 aria-pressed:bg-cinemo-gold/10 aria-pressed:text-cinemo-gold-light"
            >
              {option.label}
            </button>
          ))}
        </div>
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
                  isSavingRerelease={rereleaseMutation.isPending}
                  isSavingRereleaseFormat={rereleaseFormatMutation.isPending}
                  onVisibilityChange={(nextVisibility) =>
                    visibilityMutation.mutate({
                      movieId: movie.id,
                      visibility: nextVisibility,
                      moderationReason:
                        nextVisibility === "HIDDEN"
                          ? "관리자 검토로 숨김"
                          : null,
                    })
                  }
                  onRerelease={(releaseDate) =>
                    rereleaseMutation.mutate({ movieId: movie.id, releaseDate })
                  }
                  onRereleaseFormatChange={(theaterExclusive) =>
                    rereleaseFormatMutation.mutate({
                      movieId: movie.id,
                      theaterExclusive,
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
  isSavingRerelease,
  isSavingRereleaseFormat,
  onVisibilityChange,
  onRerelease,
  onRereleaseFormatChange,
}: {
  movie: AdminMovie;
  isUpdating: boolean;
  isSavingRerelease: boolean;
  isSavingRereleaseFormat: boolean;
  onVisibilityChange: (visibility: AdminMovieVisibility) => void;
  onRerelease: (releaseDate: string) => void;
  onRereleaseFormatChange: (theaterExclusive: TheaterExclusive | null) => void;
}) {
  const [isRereleaseFormOpen, setIsRereleaseFormOpen] = useState(false);
  const [rereleaseDate, setRereleaseDate] = useState("");
  const [theaterExclusive, setTheaterExclusive] = useState<
    TheaterExclusive | ""
  >(movie.rereleaseTheaterExclusive ?? "");
  useEffect(() => {
    setTheaterExclusive(movie.rereleaseTheaterExclusive ?? "");
  }, [movie.rereleaseTheaterExclusive]);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(movie.id);
  };
  const submitRerelease = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rereleaseDate) return;
    onRerelease(rereleaseDate);
    setRereleaseDate("");
  };

  const submitRereleaseFormat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!movie.rereleaseDate) return;
    onRereleaseFormatChange(theaterExclusive || null);
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
        <div className="mt-1 flex items-center gap-2 text-xs text-cinemo-muted">
          <span>{movie.releaseDate?.slice(0, 10) ?? "개봉일 미정"}</span>
          <span className="rounded-full bg-white/10 px-2 py-1">
            {
              VISIBILITY_OPTIONS.find(({ value }) => value === movie.visibility)
                ?.label
            }
          </span>
          {getTheaterExclusiveLabel(movie.theaterExclusive) && (
            <span className="rounded-full bg-cinemo-gold/10 px-2 py-1 text-cinemo-gold-light">
              {getTheaterExclusiveLabel(movie.theaterExclusive)}
            </span>
          )}
        </div>
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
        <label className="relative">
          <span className="sr-only">공개 상태 변경</span>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-cinemo-muted"
          />
          <select
            value={movie.visibility}
            disabled={isUpdating}
            onChange={(event) =>
              onVisibilityChange(event.target.value as AdminMovieVisibility)
            }
            className="h-full appearance-none rounded-lg border border-white/10 bg-[#0a191a] py-2 pl-3 pr-8 text-xs text-cinemo-text outline-none focus:border-cinemo-gold/60 disabled:opacity-50"
            aria-label={`${movie.title} 공개 상태`}
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setIsRereleaseFormOpen((open) => !open)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cinemo-gold/25 px-3 py-2 text-xs text-cinemo-gold-light transition hover:bg-cinemo-gold/10"
        >
          <CalendarPlus className="size-3.5" />
          재개봉 관리
        </button>
      </div>

      {isRereleaseFormOpen && (
        <div className="grid w-full gap-3 border-t border-white/10 pt-4 lg:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-[#0a191a]/70 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cinemo-gold/10 text-cinemo-gold-light">
                <CalendarPlus className="size-4" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-cinemo-text">재개봉일</h4>
                <p className="mt-1 text-xs leading-5 text-cinemo-muted">
                  최초 개봉일은 그대로 두고 국내 재개봉 날짜만 저장
                </p>
              </div>
            </div>
            <form onSubmit={submitRerelease} className="mt-4 flex flex-wrap items-end gap-2">
              <label className="grid min-w-0 flex-1 gap-1.5 text-xs font-medium text-cinemo-muted">
                직접 확인한 재개봉일
                <input
                  type="date"
                  required
                  value={rereleaseDate}
                  onChange={(event) => setRereleaseDate(event.target.value)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#101f21] px-3 text-sm text-cinemo-text outline-none focus:border-cinemo-gold/60"
                />
              </label>
              <button
                type="submit"
                disabled={isSavingRerelease || !rereleaseDate}
                className="h-10 rounded-lg bg-cinemo-gold px-4 text-sm font-semibold text-cinemo-dark disabled:opacity-50"
              >
                {isSavingRerelease ? "저장 중..." : "날짜 저장"}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0a191a]/70 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cinemo-gold/10 text-cinemo-gold-light">
                <Building2 className="size-4" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-cinemo-text">개봉 형태</h4>
                <p className="mt-1 text-xs leading-5 text-cinemo-muted">
                  {movie.rereleaseDate
                    ? `${movie.rereleaseDate.slice(0, 10)} 재개봉의 상영 형태를 변경`
                    : "재개봉일을 저장한 뒤 개봉 형태를 선택"}
                </p>
              </div>
            </div>
            <form onSubmit={submitRereleaseFormat} className="mt-4 flex flex-wrap items-end gap-2">
              <label className="grid min-w-0 flex-1 gap-1.5 text-xs font-medium text-cinemo-muted">
                재개봉 개봉 형태
                <select
                  value={theaterExclusive}
                  disabled={!movie.rereleaseDate || isSavingRereleaseFormat}
                  onChange={(event) =>
                    setTheaterExclusive(event.target.value as TheaterExclusive | "")
                  }
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#101f21] px-3 text-sm text-cinemo-text outline-none focus:border-cinemo-gold/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {THEATER_EXCLUSIVE_OPTIONS.map((option) => (
                    <option key={option.value || "GENERAL"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={!movie.rereleaseDate || isSavingRereleaseFormat}
                className="h-10 rounded-lg border border-cinemo-gold/30 px-4 text-sm font-semibold text-cinemo-gold-light transition hover:bg-cinemo-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingRereleaseFormat ? "저장 중..." : "형태 저장"}
              </button>
            </form>
          </section>
        </div>
      )}
    </article>
  );
}
