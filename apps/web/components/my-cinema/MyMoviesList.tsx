"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ko } from "@daypicker/react/locale";

import { VenueSearch } from "@/components/map/CinemaVenueSearch";
import { AppModal } from "@/components/ui/app-modal";
import { Calendar } from "@/components/ui/calendar";
import type {
  MyMovie,
  UpdateMovieRecordInput,
  ViewingPlatform,
} from "@/lib/api/movies";
import { formatDateValue } from "@/lib/date-utils";
import { myMoviesQueryOptions } from "@/lib/queries/my-movies.query";
import {
  useDeleteMovieRecord,
  useUpdateMovieRecord,
} from "@/lib/queries/movie-record.mutation";
import { MovieSpaceDrawer, type MovieSpaceTab } from "./MovieSpaceDrawer";
import { MovieCalendar } from "./MovieCalendar";

const parseDateValue = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getLocalDateValue = () => formatDateValue(new Date());

const viewingPlatformLabels: Record<ViewingPlatform, string> = {
  NETFLIX: "Netflix",
  WATCHA: "왓챠",
  TVING: "티빙",
  DISNEY_PLUS: "Disney+",
  WAVVE: "웨이브",
  APPLE_TV: "Apple TV",
  PRIME_VIDEO: "Prime Video",
  COUPANG_PLAY: "쿠팡플레이",
  TV: "TV",
  OTHER: "기타",
};

const viewingPlatformOptions: Array<{
  value: ViewingPlatform;
  label: string;
}> = [
  { value: "NETFLIX", label: "Netflix" },
  { value: "WATCHA", label: "왓챠" },
  { value: "TVING", label: "티빙" },
  { value: "DISNEY_PLUS", label: "Disney+" },
  { value: "WAVVE", label: "웨이브" },
  { value: "APPLE_TV", label: "Apple TV" },
  { value: "PRIME_VIDEO", label: "Prime Video" },
  { value: "COUPANG_PLAY", label: "쿠팡플레이" },
  { value: "TV", label: "TV" },
  { value: "OTHER", label: "기타" },
];

const hasViewingPlatform = (movie: MyMovie) =>
  movie.viewingPlaceType !== "VENUE" &&
  Boolean(movie.viewingPlatform) &&
  (movie.viewingPlatform !== "OTHER" || Boolean(movie.viewingPlatformCustom));

const ratingOptions = Array.from({ length: 10 }, (_, index) =>
  ((index + 1) * 0.5).toFixed(1),
);

export function MyMoviesList() {
  const [activeTab, setActiveTab] = useState<MovieSpaceTab>("watched");
  const myMoviesQuery = useQuery(myMoviesQueryOptions());
  const movies = myMoviesQuery.data ?? [];
  const [editingMovie, setEditingMovie] = useState<MyMovie | null>(null);
  const [viewingMovie, setViewingMovie] = useState<MyMovie | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [watchedAt, setWatchedAt] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>();
  const [rating, setRating] = useState<string | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [viewingPlaceType, setViewingPlaceType] =
    useState<UpdateMovieRecordInput["viewingPlaceType"]>(null);
  const [viewingPlatform, setViewingPlatform] =
    useState<ViewingPlatform | null>(null);
  const [viewingPlatformCustom, setViewingPlatformCustom] = useState("");

  const updateMovieRecord = useUpdateMovieRecord(editingMovie?.movieId ?? "");
  const deleteMovieRecord = useDeleteMovieRecord(editingMovie?.movieId ?? "");

  const openEditModal = (movie: MyMovie) => {
    setViewingMovie(null);
    setEditingMovie(movie);
    const initialDate = movie.watchedAt?.slice(0, 10) ?? getLocalDateValue();

    setWatchedAt(initialDate);
    setCalendarMonth(parseDateValue(initialDate));
    setRating(movie.rating);
    setVenueId(movie.venueId);
    setViewingPlaceType(
      movie.viewingPlaceType ?? (movie.venueId ? "VENUE" : null),
    );
    setViewingPlatform(movie.viewingPlatform);
    setViewingPlatformCustom(movie.viewingPlatformCustom ?? "");
  };

  const counts = useMemo(
    () => ({
      saved: movies.filter((movie) => movie.isFavorite).length,
      watched: movies.filter((movie) => movie.isWatched).length,
    }),
    [movies],
  );

  const visibleMovies = useMemo(() => {
    if (activeTab === "saved") {
      return movies.filter((movie) => movie.isFavorite);
    }

    if (activeTab === "watched") {
      return movies.filter((movie) => movie.isWatched);
    }

    return [];
  }, [activeTab, movies]);

  if (myMoviesQuery.isPending && activeTab !== "calendar") {
    return (
      <p className="text-sm text-cinemo-muted">내 영화를 불러오는 중...</p>
    );
  }

  return (
    <section className="space-y-5">
      <AppModal
        open={viewingMovie !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewingMovie(null);
          }
        }}
        title={viewingMovie?.title ?? "관람 기록"}
        description="관람 기록"
        className="max-h-[85vh] w-[calc(100%-2rem)] max-w-[calc(100%-1rem)] overflow-y-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:max-w-md"
        footer={
          viewingMovie ? (
            <>
              <button
                type="button"
                onClick={() => openEditModal(viewingMovie)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-cinemo-muted transition hover:border-cinemo-gold/50 hover:text-cinemo-gold"
              >
                관람 기록 수정
              </button>
              <Link
                href={`/movies/${viewingMovie.movieId}`}
                onClick={() => setViewingMovie(null)}
                className="rounded-lg bg-cinemo-gold px-4 py-2 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
              >
                영화 상세 보기
              </Link>
            </>
          ) : null
        }
      >
        {viewingMovie && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative aspect-2/3 w-24 shrink-0 overflow-hidden rounded-xl bg-white/5">
                {viewingMovie.posterUrl ? (
                  <Image
                    src={viewingMovie.posterUrl}
                    alt={`${viewingMovie.title} 포스터`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-xs text-cinemo-muted">
                    포스터 없음
                  </div>
                )}
              </div>

              <dl className="min-w-0 flex-1 space-y-2 text-sm">
                <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-2">
                  <dt className="text-xs text-cinemo-gold">날짜</dt>
                  <dd className="min-w-0 break-words text-cinemo-text">
                    {viewingMovie.watchedAt
                      ?.slice(0, 10)
                      .replaceAll("-", ".") ?? "관람일 미정"}
                  </dd>
                </div>

                <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-2">
                  <dt className="text-xs text-cinemo-gold">관람 장소</dt>
                  <dd className="min-w-0 break-words font-medium text-cinemo-text">
                    {viewingMovie.viewingPlaceType === "VENUE"
                      ? (viewingMovie.venue?.name ?? "다른 장소에서 관람")
                      : "집"}
                  </dd>
                </div>

                {hasViewingPlatform(viewingMovie) && (
                  <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-2">
                    <dt className="text-xs text-cinemo-gold">플랫폼</dt>
                    <dd className="min-w-0 break-words font-medium text-cinemo-text">
                      {viewingMovie.viewingPlatform === "OTHER"
                        ? viewingMovie.viewingPlatformCustom
                        : viewingMovie.viewingPlatform
                          ? viewingPlatformLabels[viewingMovie.viewingPlatform]
                          : null}
                    </dd>
                  </div>
                )}

                {viewingMovie.rating && (
                  <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-2">
                    <dt className="text-xs text-cinemo-gold">평점</dt>
                    <dd className="inline-flex items-center gap-1 text-cinemo-gold-light">
                      <Star className="size-3.5 fill-current" />
                      {viewingMovie.rating}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        open={editingMovie !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMovie(null);
          }
        }}
        title="관람 기록 수정"
        description={editingMovie?.title}
        className="max-h-[85vh] w-[calc(100%-2rem)] max-w-[calc(100%-1rem)] overflow-x-hidden overflow-y-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:max-w-md"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm text-cinemo-muted">관람일</p>
            <Calendar
              mode="single"
              locale={ko}
              captionLayout="dropdown"
              startMonth={new Date(new Date().getFullYear() - 100, 0, 1)}
              month={calendarMonth}
              selected={parseDateValue(watchedAt)}
              onMonthChange={setCalendarMonth}
              onSelect={(date) => {
                if (date) {
                  setWatchedAt(formatDateValue(date));
                }
              }}
              disabled={{ after: parseDateValue(getLocalDateValue()) }}
              endMonth={parseDateValue(getLocalDateValue())}
              className="mx-auto max-w-full overflow-hidden"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-cinemo-muted">평점</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRating(null)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  rating === null
                    ? "border-cinemo-gold bg-cinemo-gold/10 text-cinemo-gold"
                    : "border-white/10 text-cinemo-muted"
                }`}
              >
                없음
              </button>

              {ratingOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    rating === value
                      ? "border-cinemo-gold bg-cinemo-gold/10 text-cinemo-gold"
                      : "border-white/10 text-cinemo-muted"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-cinemo-muted">관람 장소 변경</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setVenueId(null);
                  setViewingPlaceType("HOME");
                }}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  viewingPlaceType === "HOME"
                    ? "border-cinemo-gold bg-cinemo-gold/10 text-cinemo-gold"
                    : "border-white/10 text-cinemo-muted"
                }`}
              >
                집에서 보기
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewingPlaceType("VENUE");
                  setViewingPlatform(null);
                }}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  viewingPlaceType === "VENUE"
                    ? "border-cinemo-gold bg-cinemo-gold/10 text-cinemo-gold"
                    : "border-white/10 text-cinemo-muted"
                }`}
              >
                다른 장소에서 보기
              </button>
            </div>

            {viewingPlaceType === "HOME" && (
              <div className="space-y-2">
                <p className="text-sm text-cinemo-muted">시청 플랫폼</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingPlatform(null)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      viewingPlatform === null
                        ? "border-cinemo-gold bg-cinemo-gold/10 text-cinemo-gold"
                        : "border-white/10 text-cinemo-muted"
                    }`}
                  >
                    선택 안 함
                  </button>

                  {viewingPlatformOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setViewingPlatform(option.value);
                        if (option.value !== "OTHER") {
                          setViewingPlatformCustom("");
                        }
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        viewingPlatform === option.value
                          ? "border-cinemo-gold bg-cinemo-gold/10 text-cinemo-gold"
                          : "border-white/10 text-cinemo-muted"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {viewingPlatform === "OTHER" && (
                  <input
                    value={viewingPlatformCustom}
                    onChange={(event) =>
                      setViewingPlatformCustom(event.target.value)
                    }
                    placeholder="플랫폼 이름을 직접 입력"
                    maxLength={100}
                    className="w-full rounded-lg border border-white\/10 bg-white/3 px-3 py-2 text-sm  outline-none placeholder:text-cinemo-muted focus:border-cinemo-gold"
                  />
                )}
              </div>
            )}

            {viewingPlaceType === "VENUE" && (
              <VenueSearch
                onSelected={(selectedVenueId) => {
                  setVenueId(selectedVenueId);
                  setViewingPlaceType("VENUE");
                  setViewingPlatform(null);
                }}
              />
            )}
          </div>

          <button
            type="button"
            disabled={
              !watchedAt ||
              updateMovieRecord.isPending ||
              (viewingPlatform === "OTHER" && !viewingPlatformCustom.trim())
            }
            onClick={() => {
              updateMovieRecord.mutate(
                {
                  isWatched: true,
                  watchedAt,
                  rating,
                  venueId,
                  viewingPlaceType,
                  viewingPlatform,
                  viewingPlatformCustom:
                    viewingPlatform === "OTHER"
                      ? viewingPlatformCustom.trim() || null
                      : null,
                },
                {
                  onSuccess: () => setEditingMovie(null),
                },
              );
            }}
            className="w-full rounded-lg bg-cinemo-gold px-4 py-3 font-semibold text-cinemo-bg disabled:opacity-50"
          >
            {updateMovieRecord.isPending ? "저장 중..." : "변경사항 저장"}
          </button>

          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="mt-2 w-full rounded-lg border border-red-400/40 px-4 py-3 text-sm text-red-300 disabled:opacity-50"
          >
            관람 기록 삭제
          </button>
        </div>
      </AppModal>

      <AppModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="관람 기록 삭제"
        description="관람 기록을 삭제하시겠습니까?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-cinemo-muted"
            >
              취소
            </button>
            <button
              type="button"
              disabled={deleteMovieRecord.isPending}
              onClick={() => {
                deleteMovieRecord.mutate(undefined, {
                  onSuccess: () => {
                    setDeleteConfirmOpen(false);
                    setEditingMovie(null);
                  },
                });
              }}
              className="rounded-lg bg-red-500/80 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {deleteMovieRecord.isPending ? "삭제 중..." : "삭제"}
            </button>
          </>
        }
      />

      <MovieSpaceDrawer
        activeTab={activeTab}
        onChange={setActiveTab}
        counts={counts}
      />

      {activeTab === "calendar" ? (
        <MovieCalendar />
      ) : visibleMovies.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
          <p className="text-sm text-cinemo-muted">
            {activeTab === "saved"
              ? "찜한 영화가 없습니다."
              : "관람 기록이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleMovies.map((movie) => (
            <div key={movie.id} className="relative w-full max-w-sm">
              <button
                type="button"
                onClick={() => setViewingMovie(movie)}
                className="flex w-full min-w-0 gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/3 text-left transition hover:border-cinemo-gold/50 hover:bg-white/6"
              >
                <div className="relative aspect-2/3 w-24 shrink-0 self-start sm:w-28">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={`${movie.title} 포스터`}
                      width={160}
                      height={240}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white/5 text-center text-xs text-cinemo-muted">
                      포스터 없음
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center p-3 pr-12">
                  <dl className="space-y-1.5 text-[11px] leading-5">
                    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2">
                      <dt className="text-cinemo-gold">제목</dt>
                      <dd className="line-clamp-2 min-w-0 font-semibold text-cinemo-text">
                        {movie.title}
                      </dd>
                    </div>

                    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2">
                      <dt className="text-cinemo-gold">날짜</dt>
                      <dd className="min-w-0 text-cinemo-muted">
                        {(movie.watchedAt ?? movie.releaseDate)
                          ?.slice(0, 10)
                          .replaceAll("-", ".") ?? "-"}
                      </dd>
                    </div>

                    {movie.rating && (
                      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2">
                        <dt className="text-cinemo-gold">평점</dt>
                        <dd className="inline-flex items-center gap-1 text-cinemo-gold-light">
                          <Star className="size-3 fill-current" />
                          {movie.rating}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
