"use client";

import {useQuery} from "@tanstack/react-query";
import {Eye, EyeClosed, Heart, Star} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {ko} from "@daypicker/react/locale";

import {AppModal} from "@/components/ui/app-modal";
import {Calendar} from "@/components/ui/calendar";
import {movieRecordQueryOptions,} from "@/lib/queries/movie-record.query";
import {useUpdateMovieRecord} from "@/lib/queries/movie-record.mutation";
import {useAuthStore} from "@/stores/auth.store";
import {VenueSearch} from "@/components/map/CinemaVenueSearch";
import {ViewingPlatform} from "@/lib/api/movies";

type MovieRecordActionsProps = {
  movieId: string;
};

const ratingOptions = Array.from({ length: 10 }, (_, index) =>
  ((index + 1) * 0.5).toFixed(1),
);

const viewingPlatformOptions: {value: ViewingPlatform; label: string}[] = [
  {value: "NETFLIX", label: "Netflix"},
  {value: "WATCHA", label: "왓챠"},
  {value: "TVING", label: "티빙"},
  {value: "DISNEY_PLUS", label: "Disney+"},
  {value: "WAVVE", label: "웨이브"},
  {value: "APPLE_TV", label: "Apple TV"},
  {value: "TV", label: "TV"},
  {value: "OTHER", label: "기타"},
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

type ViewingPlaceSelection = "HOME" | "VENUE";

export function MovieRecordActions({ movieId }: MovieRecordActionsProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const recordQuery = useQuery({
    ...movieRecordQueryOptions(movieId),
    enabled: Boolean(user),
  });
  const updateRecord = useUpdateMovieRecord(movieId);
  const [loginRequired, setLoginRequired] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [watchedDateOpen, setWatchedDateOpen] = useState(false);
  const [watchedDate, setWatchedDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>();
  const [venueSearchOpen, setVenueSearchOpen] = useState(false);
  const [viewingPlaceSelection, setViewingPlaceSelection] =
    useState<ViewingPlaceSelection>("VENUE");
  const [viewingPlatform, setViewingPlatform] =
    useState<ViewingPlatform | null>(null);
  const [viewingPlatformCustom, setViewingPlatformCustom] = useState("");

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
    setViewingPlaceSelection(
      record?.viewingPlaceType === "HOME" ? "HOME" : "VENUE",
    );
    setViewingPlatform(record?.viewingPlatform ?? null);
    setViewingPlatformCustom(record?.viewingPlatformCustom ?? "");
    setVenueSearchOpen(true);
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

      <AppModal
        open={venueSearchOpen}
        onOpenChange={setVenueSearchOpen}
        title="어디서 봤나요?"
        description="관람 방식을 선택하세요."
        className="max-h-[85vh] w-[calc(100%-2rem)] overflow-hidden sm:max-w-md"
      >
        <div
          role="radiogroup"
          aria-label="관람 방식"
          className="grid gap-2 sm:grid-cols-2"
        >
          {[
            { value: "HOME" as const, label: "집에서 보기" },
            { value: "VENUE" as const, label: "관람 장소 선택" },
          ].map((option) => {
            const selected = viewingPlaceSelection === option.value;

            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  selected
                    ? "border-cinemo-gold bg-cinemo-gold/10 text-cinemo-gold"
                    : "border-white/10 bg-white/3 text-cinemo-muted hover:border-white/25"
                }`}
              >
                <input
                  type="radio"
                  name="viewing-place"
                  value={option.value}
                  checked={selected}
                  onChange={() => {
                    setViewingPlaceSelection(option.value);

                    if (option.value === "VENUE") {
                      setViewingPlatform(null);
                    }
                  }}
                  className="size-4 accent-cinemo-gold"
                />
                {option.label}
              </label>
            );
          })}
        </div>

        {viewingPlaceSelection === "VENUE" ? (
          <div className="mt-4 space-y-3">
            <VenueSearch
              onSelected={(venueId) => {
                setVenueSearchOpen(false);

                updateRecord.mutate({
                  isWatched: true,
                  watchedAt: watchedDate,
                  venueId,
                  viewingPlaceType: "VENUE",
                  viewingPlatform: null,
                });
              }}
            />
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {viewingPlatformOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${
                    viewingPlatform === option.value
                      ? "border-cinemo-gold bg-cinemo-gold/10 text-cinemo-gold"
                      : "border-white/10 bg-white/3 text-cinemo-muted hover:border-white/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="viewing-platform"
                    value={option.value}
                    checked={viewingPlatform === option.value}
                    onChange={() => {
                      setViewingPlatform(option.value);
                      if (option.value !== "OTHER") {
                        setViewingPlatformCustom("");
                      }
                    }}
                    className="size-4 accent-cinemo-gold"
                  />
                  {option.label}
                </label>
              ))}
            </div>

            {viewingPlatform === "OTHER" && (
              <input
                value={viewingPlatformCustom}
                onChange={(event) => setViewingPlatformCustom(event.target.value)}
                placeholder="플랫폼 이름을 직접 입력"
                maxLength={100}
                className="mt-3 w-full rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-sm text-white outline-none placeholder:text-cinemo-muted focus:border-cinemo-gold"
              />
            )}

            <button
              type="button"
              disabled={
                updateRecord.isPending ||
                (viewingPlatform === "OTHER" && !viewingPlatformCustom.trim())
              }
              onClick={() => {
                setVenueSearchOpen(false);

                updateRecord.mutate({
                  isWatched: true,
                  watchedAt: watchedDate,
                  venueId: null,
                  viewingPlaceType: "HOME",
                  viewingPlatform,
                  viewingPlatformCustom:
                    viewingPlatform === "OTHER"
                      ? viewingPlatformCustom.trim() || null
                      : null,
                });
              }}
              className="mt-4 w-full rounded-lg bg-cinemo-gold px-4 py-3 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
            >
              집에서 본 것으로 저장
            </button>
          </>
        )}
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
