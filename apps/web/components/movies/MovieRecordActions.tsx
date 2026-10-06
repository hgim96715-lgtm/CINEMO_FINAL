"use client";

import { CalendarDays, Eye, EyeClosed, Heart, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ko } from "@daypicker/react/locale";

import { AppModal } from "@/components/ui/app-modal";
import { Calendar } from "@/components/ui/calendar";
import {
  useMovieRecord,
  useUpdateMovieRecord,
} from "@/lib/queries/movie-record.query";
import { useAuthStore } from "@/stores/auth.store";

type MovieRecordActionsProps = {
  movieId: string;
};

const ratingOptions = [
  "0.5",
  "1.0",
  "1.5",
  "2.0",
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0",
];

const getLocalDateValue = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localTime.toISOString().slice(0, 10);
};

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

export function MovieRecordActions({ movieId }: MovieRecordActionsProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const recordQuery = useMovieRecord(movieId, Boolean(user));
  const updateRecord = useUpdateMovieRecord(movieId);
  const [loginRequired, setLoginRequired] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [watchedDateOpen, setWatchedDateOpen] = useState(false);
  const [watchedDate, setWatchedDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>();

  const record = recordQuery.data;
  const isFavorite = record?.isFavorite ?? false;
  const isWatched = record?.isWatched ?? false;

  const requireLogin = () => {
    setLoginRequired(true);
  };

  const goToLogin = () => {
    router.push("/login");
  };

  const toggleFavorite = () => {
    if (!user) {
      requireLogin();
      return;
    }

    updateRecord.mutate({
      isFavorite: !isFavorite,
    });
  };

  const toggleWatched = () => {
    if (!user) {
      requireLogin();
      return;
    }

    if (isWatched) {
      updateRecord.mutate({ isWatched: false });
      return;
    }

    const initialDate = record?.watchedAt?.slice(0, 10) ?? getLocalDateValue();

    setWatchedDate(initialDate);
    setCalendarMonth(parseDateValue(initialDate));
    setWatchedDateOpen(true);
  };

  const selectWatchedDate = (date: string) => {
    if (!date) {
      return;
    }

    setWatchedDate(date);
    setWatchedDateOpen(false);
    updateRecord.mutate({
      isWatched: true,
      watchedAt: date,
    });
  };

  const toggleRatingMenu = () => {
    if (!user) {
      requireLogin();
      return;
    }

    if (!isDisabled) {
      setRatingOpen((open) => !open);
    }
  };

  const selectRating = (rating: string | null) => {
    setRatingOpen(false);
    updateRecord.mutate({ rating });
  };

  const isDisabled = recordQuery.isLoading || updateRecord.isPending;

  return (
    <>
      <AppModal
        open={loginRequired}
        onOpenChange={setLoginRequired}
        title="로그인이 필요합니다"
        description="찜하기·봤어요·평점은 로그인 후 저장할 수 있습니다."
        footer={
          <button
            type="button"
            onClick={goToLogin}
            className="whitespace-nowrap rounded-lg bg-cinemo-gold px-3 py-2 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
          >
            로그인 페이지로 이동
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">

      <button
        type="button"
        onClick={toggleFavorite}
        disabled={isDisabled}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "찜하기 해제" : "찜하기"}
        className={`group inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-semibold backdrop-blur transition disabled:opacity-50 ${
          isFavorite
            ? "border-cinemo-gold/60 bg-cinemo-gold/15 text-cinemo-gold-light"
            : "border-white/20 bg-white/5 text-cinemo-text hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10"
        }`}
      >
        <Heart
          className={`size-4 ${
            isFavorite ? "fill-cinemo-gold text-cinemo-gold" : ""
          }`}
        />
        찜하기
      </button>

      <div className="relative flex flex-col items-start">
        <button
          type="button"
          onClick={toggleWatched}
          disabled={isDisabled}
          aria-pressed={isWatched}
          aria-expanded={watchedDateOpen}
          aria-label={isWatched ? "봤어요 해제" : "봤어요 날짜 선택"}
          className={`group inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-semibold backdrop-blur transition disabled:opacity-50 ${
            isWatched
              ? "border-cinemo-gold/60 bg-cinemo-gold/15 text-cinemo-gold-light"
              : "border-white/20 bg-white/5 text-cinemo-text hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10"
          }`}
        >
          {isWatched ? (
            <Eye className="size-4 text-cinemo-gold" />
          ) : (
            <EyeClosed className="size-4 text-white/70" />
          )}
          봤어요
        </button>

        {watchedDateOpen && (
          <div
            role="dialog"
            aria-label="관람 날짜 선택"
            className="absolute left-0 bottom-full z-30 mb-2 w-72 rounded-2xl border border-cinemo-gold/25 bg-[#102326]/98 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-cinemo-text">
                <CalendarDays className="size-4 text-cinemo-gold" />
                언제 봤나요?
              </div>

              <button
                type="button"
                onClick={() => setWatchedDateOpen(false)}
                aria-label="달력 닫기"
                className="rounded-md p-1 text-cinemo-muted transition hover:bg-white/10 hover:text-cinemo-text"
              >
                <X className="size-4" />
              </button>
            </div>

            <Calendar
              mode="single"
              locale={ko}
              month={calendarMonth}
              selected={parseDateValue(watchedDate)}
              onMonthChange={setCalendarMonth}
              onSelect={(date) => {
                if (date) {
                  selectWatchedDate(formatDateValue(date));
                }
              }}
              disabled={{ after: parseDateValue(getLocalDateValue()) }}
              endMonth={parseDateValue(getLocalDateValue())}
              className="mx-auto"
            />

            <p className="mt-3 border-t border-white/10 pt-3 text-center text-[11px] text-cinemo-muted">
              선택한 날짜에 봤어요 기록이 저장됨
            </p>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={toggleRatingMenu}
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={ratingOpen}
          aria-label="평점 선택"
          className="inline-flex items-center gap-2 rounded-xl border border-cinemo-gold/30 bg-white/5 px-4 py-3 text-sm text-cinemo-muted transition hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10 disabled:opacity-50"
        >
          <Star
            className={`size-4 text-cinemo-gold ${
              record?.rating ? "fill-cinemo-gold" : ""
            }`}
          />
          <span className={record?.rating ? "text-cinemo-text" : undefined}>
            {record?.rating ? `${record.rating}점` : "평점"}
          </span>
        </button>

        {ratingOpen && (
          <div
            role="listbox"
            aria-label="평점 선택 목록"
            className="absolute right-0 bottom-full z-30 mb-2 grid w-52 grid-cols-2 gap-1.5 rounded-xl border border-cinemo-gold/25 bg-[#102326]/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            <button
              type="button"
              role="option"
              aria-selected={!record?.rating}
              onClick={() => selectRating(null)}
              className="col-span-2 rounded-lg px-3 py-2 text-left text-xs text-cinemo-muted transition hover:bg-white/10 hover:text-cinemo-text"
            >
              평점 없음
            </button>

            {ratingOptions.map((rating) => (
              <button
                key={rating}
                type="button"
                role="option"
                aria-selected={record?.rating === rating}
                onClick={() => selectRating(rating)}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  record?.rating === rating
                    ? "bg-cinemo-gold/20 font-semibold text-cinemo-gold-light"
                    : "text-cinemo-text hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light"
                }`}
              >
                {rating}점
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
