"use client";

import {useMemo, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {Eye, Pencil, Star} from "lucide-react";
import {useQuery} from "@tanstack/react-query";
import {ko} from "@daypicker/react/locale";

import {VenueSearch} from "@/components/map/CinemaVenueSearch";
import {AppModal} from "@/components/ui/app-modal";
import {Calendar} from "@/components/ui/calendar";
import type {MyMovie, UpdateMovieRecordInput} from "@/lib/api/movies";
import {myMoviesQueryOptions} from "@/lib/queries/my-movies.query";
import {useUpdateMovieRecord} from "@/lib/queries/movie-record.mutation";
import {MovieSpaceDrawer, type MovieSpaceTab,} from "./MovieSpaceDrawer";

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateValue = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getLocalDateValue = () => formatDateValue(new Date());

export function MyMoviesList() {
  const [activeTab, setActiveTab] = useState<MovieSpaceTab>("saved");
  const myMoviesQuery = useQuery(myMoviesQueryOptions());
  const movies = myMoviesQuery.data ?? [];
  const [editingMovie, setEditingMovie] = useState<MyMovie | null>(null);
  const [watchedAt, setWatchedAt] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>();
  const [rating, setRating] = useState<string | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [viewingPlaceType, setViewingPlaceType] = useState<
    UpdateMovieRecordInput["viewingPlaceType"]
  >(null);

  const updateMovieRecord = useUpdateMovieRecord(
      editingMovie?.movieId ?? "",
  );

  const openEditModal = (movie: MyMovie) => {
    setEditingMovie(movie);
    const initialDate = movie.watchedAt?.slice(0, 10) ?? getLocalDateValue();

    setWatchedAt(initialDate);
    setCalendarMonth(parseDateValue(initialDate));
    setRating(movie.rating);
    setVenueId(movie.venueId);
    setViewingPlaceType(movie.viewingPlaceType ?? (movie.venueId ? "VENUE" : null));
  };
  
  const counts = useMemo(
      () => ({
        saved: movies.filter((movie) => movie.isFavorite).length,
        watched: movies.filter((movie) => movie.isWatched).length,
        postcards: 0,
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
  
  if (myMoviesQuery.isPending) {
    return (
        <p className="text-sm text-cinemo-muted">내 영화를 불러오는 중...</p>
    );
  }
  
  return (
      <section className="space-y-5">
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
                  disabled={{after: parseDateValue(getLocalDateValue())}}
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

                {["0.5", "1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0"].map(
                    (value) => (
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
                    ),
                )}
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
              </div>
              <VenueSearch
                onSelected={(selectedVenueId) => {
                  setVenueId(selectedVenueId);
                  setViewingPlaceType("VENUE");
                }}
              />
            </div>

            <button
                type="button"
                disabled={!watchedAt || updateMovieRecord.isPending}
                onClick={() => {
                  updateMovieRecord.mutate(
                      {
                        isWatched: true,
                        watchedAt,
                        rating,
                        venueId,
                        viewingPlaceType,
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
          </div>
        </AppModal>

        <MovieSpaceDrawer
            activeTab={activeTab}
            onChange={setActiveTab}
            counts={counts}
        />
        
        {activeTab === "postcards" ? (
            <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
              <p className="text-sm text-cinemo-muted">
                작성한 엽서가 없습니다.
              </p>
            </div>
        ) : visibleMovies.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
              <p className="text-sm text-cinemo-muted">
                {activeTab === "saved"
                    ? "찜한 영화가 없습니다."
                    : "본 영화가 없습니다."}
              </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleMovies.map((movie) => (
                  <div key={movie.id} className="relative w-full max-w-sm">
                    <Link
                      href={`/movies/${movie.movieId}`}
                      className="flex w-full min-w-0 gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/3 transition hover:border-cinemo-gold/50 hover:bg-white/6"
                    >
                    <div className="relative aspect-2/3 w-24 shrink-0 sm:w-28">
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
                      <h3 className="line-clamp-2 text-sm font-semibold text-cinemo-text">
                        {movie.title}
                      </h3>
                      
                      {(movie.watchedAt ?? movie.releaseDate) && (
                          <p className="mt-1 text-xs text-cinemo-muted">
                            {(movie.watchedAt ?? movie.releaseDate)?.slice(0, 10)}
                          </p>
                      )}
                      
                      
                      
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        {movie.isWatched && (
                            <span className="inline-flex items-center gap-1 text-cinemo-muted">
                      <Eye className="size-3.5" />
                      관람
                    </span>
                        )}
                        
                        
                        {movie.rating && (
                            <span className="inline-flex items-center gap-1 text-cinemo-gold-light">
                      <Star className="size-3.5 fill-current" />
                              {movie.rating}
                    </span>
                        )}
                      </div>
                      
                      {movie.isWatched &&
                          (movie.viewingPlaceType === "HOME" || movie.venue) && (
                              <p className="mt-2 line-clamp-1 text-xs text-cinemo-muted">
                                {movie.viewingPlaceType === "HOME"
                                    ? "집에서 관람"
                                    : movie.venue?.name}
                              </p>
                          )}
                    </div>
                    </Link>

                    {movie.isWatched && (
                      <button
                        type="button"
                        aria-label={`${movie.title} 관람 기록 편집`}
                        onClick={() => openEditModal(movie)}
                        className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 backdrop-blur transition hover:border-cinemo-gold hover:text-cinemo-gold"
                      >
                        <Pencil className="size-4" />
                      </button>
                    )}
                  </div>
              ))}
            </div>
        )}
      </section>
  );
}
