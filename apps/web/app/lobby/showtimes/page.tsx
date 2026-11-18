"use client";

import { FormEvent, useState } from "react";
import { Clock3, ExternalLink, LoaderCircle, MapPin, Search } from "lucide-react";

import { apiClient, getApiErrorMessage } from "@/lib/api/apiClient";

type Showtime = {
  chain: "CGV" | "LOTTE_CINEMA" | "MEGABOX";
  theaterName: string;
  address: string | null;
  distanceKm: number;
  startsAt: string;
  endsAt: string | null;
  screenName: string | null;
  remainingSeats: number | null;
  bookingUrl: string;
};

type ShowtimeResponse = {
  movieTitle: string;
  date: string;
  items: Showtime[];
  unavailableChains: string[];
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function chainLabel(chain: Showtime["chain"]) {
  return chain === "LOTTE_CINEMA" ? "롯데시네마" : chain;
}

export default function ShowtimePage() {
  const [movieTitle, setMovieTitle] = useState("");
  const [result, setResult] = useState<ShowtimeResponse>();
  const [message, setMessage] = useState("영화 제목과 현재 위치를 입력하면 가까운 극장의 다음 회차를 비교함.");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = movieTitle.trim();
    if (!normalizedTitle) {
      setMessage("영화 제목을 입력해 주세요.");
      return;
    }
    if (!navigator.geolocation) {
      setMessage("이 브라우저는 현재 위치 확인을 지원하지 않음.");
      return;
    }

    setIsLoading(true);
    setMessage("현재 위치를 확인하는 중…");
    setResult(undefined);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setMessage("가까운 CGV·롯데시네마·메가박스 회차를 비교하는 중…");
          const { data } = await apiClient.get<ShowtimeResponse>("/cinema-showtimes", {
            params: {
              movieTitle: normalizedTitle,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
          setResult(data);
          setMessage(
            data.items.length > 0
              ? `${data.items.length}개 회차를 가장 빠른 시간 순으로 정리했음.`
              : "이 영화의 상영 회차를 찾지 못했음. 다른 날짜 또는 영화 제목을 확인해 주세요.",
          );
        } catch (error) {
          setMessage(getApiErrorMessage(error, "상영시간표를 불러오지 못했음. 잠시 후 다시 시도해 주세요."));
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setIsLoading(false);
        setMessage("가까운 상영시간을 비교하려면 현재 위치 권한이 필요함.");
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 10_000 },
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-12">
      <header className="rounded-[2rem] border border-cinemo-gold/25 bg-[radial-gradient(circle_at_top_right,rgba(212,171,83,0.16),transparent_42%)] px-6 py-8 sm:px-10">
        <p className="text-xs font-semibold tracking-[0.32em] text-cinemo-gold">CINEMA TIME</p>
        <h1 className="mt-4 text-3xl font-semibold text-cinemo-text sm:text-4xl">가장 빠른 영화 보러가기</h1>
        <p className="mt-3 max-w-2xl text-cinemo-muted">한 번의 검색으로 내 주변 CGV·롯데시네마·메가박스의 상영 시작 시간을 비교하고, 선택한 극장의 공식 예매 페이지로 이동함.</p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl border border-cinemo-border bg-cinemo-background/80 px-4">
            <Search aria-hidden="true" className="size-5 text-cinemo-gold-light" />
            <input
              value={movieTitle}
              onChange={(event) => setMovieTitle(event.target.value)}
              placeholder="보고 싶은 영화 제목"
              className="w-full bg-transparent text-cinemo-text outline-none placeholder:text-cinemo-muted"
            />
          </label>
          <button disabled={isLoading} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-cinemo-gold px-6 font-semibold text-cinemo-background transition hover:bg-cinemo-gold-light disabled:cursor-wait disabled:opacity-60">
            {isLoading ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : <MapPin aria-hidden="true" className="size-5" />}
            내 주변 회차 보기
          </button>
        </form>
        <p aria-live="polite" className="mt-4 text-sm text-cinemo-muted">{message}</p>
      </header>

      {result?.unavailableChains.length ? (
        <p className="mt-5 rounded-xl border border-cinemo-border bg-cinemo-surface px-4 py-3 text-sm text-cinemo-muted">
          일시적으로 확인하지 못한 체인: {result.unavailableChains.join(" · ")}
        </p>
      ) : null}

      {result?.items.length ? (
        <section className="mt-8 space-y-3" aria-label={`${result.movieTitle} 상영시간표`}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] text-cinemo-gold">NEAREST SHOWTIMES</p>
              <h2 className="mt-2 text-2xl font-semibold text-cinemo-text">{result.movieTitle}</h2>
            </div>
            <span className="text-sm text-cinemo-muted">{result.date}</span>
          </div>
          {result.items.map((showtime) => (
            <article key={`${showtime.chain}-${showtime.theaterName}-${showtime.startsAt}-${showtime.screenName ?? ""}`} className="flex flex-col gap-4 rounded-2xl border border-cinemo-border bg-cinemo-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="rounded-full border border-cinemo-gold/35 px-2.5 py-1 text-xs font-semibold text-cinemo-gold-light">{chainLabel(showtime.chain)}</span>
                <h3 className="mt-3 font-semibold text-cinemo-text">{showtime.theaterName}</h3>
                <p className="mt-1 text-sm text-cinemo-muted">{showtime.distanceKm}km · {showtime.address ?? "주소 정보 없음"}</p>
              </div>
              <div className="flex items-center gap-5 sm:text-right">
                <div>
                  <p className="flex items-center gap-1 text-xl font-semibold text-cinemo-text sm:justify-end"><Clock3 aria-hidden="true" className="size-4 text-cinemo-gold" />{formatTime(showtime.startsAt)}</p>
                  <p className="mt-1 text-xs text-cinemo-muted">{showtime.screenName ?? "상영관 정보 없음"}{showtime.remainingSeats === null ? "" : ` · 잔여 ${showtime.remainingSeats}석`}</p>
                </div>
                <a href={showtime.bookingUrl} target="_blank" rel="noreferrer" className="inline-flex size-10 items-center justify-center rounded-xl bg-cinemo-gold/15 text-cinemo-gold-light transition hover:bg-cinemo-gold/25" aria-label={`${showtime.theaterName} 공식 예매로 이동`}><ExternalLink aria-hidden="true" className="size-4" /></a>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
