"use client";

import { Eye, EyeClosed, Heart, Star } from "lucide-react";
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
  const selectedRating = record?.rating
    ? Number(record.rating).toFixed(1)
    : null;

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

      <AppModal
        open={watchedDateOpen}
        onOpenChange={setWatchedDateOpen}
        title="언제 봤나요?"
        description="관람 날짜를 선택하면 봤어요 기록이 저장됩니다."
        className="w-[calc(100%-2rem)] sm:max-w-md"
      >
        <Calendar
          mode="single"
          locale={ko}
          captionLayout="dropdown"
          startMonth={new Date(new Date().getFullYear() - 100, 0, 1)}
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
          className="mx-auto w-full"
        />
      </AppModal>

      <AppModal
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        title="평점 선택"
        description="이 영화에 대한 나의 평점을 선택하세요."
        className="w-[calc(100%-2rem)] sm:max-w-sm"
      >
        <div
          role="listbox"
          aria-label="평점 선택 목록"
          className="grid grid-cols-2 gap-1.5"
        >
          <button
            type="button"
            role="option"
            aria-selected={!selectedRating}
            onClick={() => selectRating(null)}
            className="col-span-2 rounded-lg px-3 py-2 text-left text-sm text-cinemo-muted transition hover:bg-white/10 hover:text-cinemo-text"
          >
            평점 없음
          </button>

          {ratingOptions.map((rating) => (
            <button
              key={rating}
              type="button"
              role="option"
              aria-selected={selectedRating === rating}
              onClick={() => selectRating(rating)}
              className={`rounded-lg px-3 py-2.5 text-sm transition ${
                selectedRating === rating
                  ? "bg-cinemo-gold/20 font-semibold text-cinemo-gold-light"
                  : "text-cinemo-text hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light"
              }`}
            >
              {rating}점
            </button>
          ))}
        </div>
      </AppModal>

      <div className="flex w-37 flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={isDisabled}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "찜하기 해제" : "찜하기"}
          title={isFavorite ? "찜하기 해제" : "찜하기"}
          className={`group inline-flex h-11 w-11 items-center justify-center gap-0 rounded-xl border px-0 py-0 font-semibold backdrop-blur transition disabled:opacity-50 sm:h-[52px] sm:w-28 sm:min-w-28 sm:max-w-28 sm:flex-none sm:gap-2 sm:px-3 sm:py-0 ${
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
          <span className="hidden sm:inline">찜하기</span>
        </button>

        <div className="relative flex flex-col items-start">
          <button
            type="button"
            onClick={toggleWatched}
            disabled={isDisabled}
            aria-pressed={isWatched}
            aria-expanded={watchedDateOpen}
            aria-label={isWatched ? "봤어요 해제" : "봤어요 날짜 선택"}
            title={isWatched ? "봤어요 해제" : "봤어요 날짜 선택"}
            className={`group inline-flex h-11 w-11 items-center justify-center gap-0 rounded-xl border px-0 py-0 font-semibold backdrop-blur transition disabled:opacity-50 sm:h-[52px] sm:w-28 sm:min-w-28 sm:max-w-28 sm:flex-none sm:gap-2 sm:px-3 sm:py-0 ${
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
            <span className="hidden sm:inline">봤어요</span>
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={toggleRatingMenu}
            disabled={isDisabled}
            aria-haspopup="listbox"
            aria-expanded={ratingOpen}
            aria-label="평점 선택"
            title="평점 선택"
            className={`inline-flex h-11 w-11 items-center justify-center gap-0 rounded-xl border px-0 py-0 text-sm transition disabled:opacity-50 sm:h-[52px] sm:w-28 sm:min-w-28 sm:max-w-28 sm:flex-none sm:justify-center sm:gap-2 sm:px-3 sm:py-0 ${
              selectedRating
                ? "border-cinemo-gold/60 bg-cinemo-gold/15 text-cinemo-gold-light"
                : "border-white/20 bg-white/5 text-cinemo-text hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10"
            }`}
          >
            <Star
              className={`size-4 ${
                record?.rating
                  ? "fill-cinemo-gold text-cinemo-gold"
                  : "text-cinemo-muted"
              }`}
            />
            <span className="hidden sm:inline">
              {selectedRating ? `${selectedRating}점` : "평점"}
            </span>
          </button>

        </div>
      </div>
    </>
  );
}
