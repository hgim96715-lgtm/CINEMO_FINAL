"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleCheck, CircleX, Crown, HelpCircle, LoaderCircle, Sparkles, Ticket, Trophy } from "lucide-react";

import { apiClient, getApiErrorMessage } from "@/lib/api/apiClient";
import { AppModal } from "@/components/ui/app-modal";

type QuizRound = {
  roundId: string;
  prompt: string;
  choices: string[];
  posterUrl: string | null;
  attemptsRemaining: number;
  status: "ACTIVE" | "CORRECT" | "FAILED";
  scoreAwarded: number;
  answer?: string;
};

type LeaderboardEntry = {
  rank: number;
  nickname: string;
  profileImageUrl: string | null;
  score: number;
  correctCount: number;
};

export default function MovieQuizPage() {
  const [round, setRound] = useState<QuizRound>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void apiClient
      .get<LeaderboardEntry[]>("/movie-quizzes/leaderboard/weekly", { signal: controller.signal })
      .then(({ data }) => setLeaderboard(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function startRound() {
    setIsRetryModalOpen(false);
    setIsResultModalOpen(false);
    setErrorMessage(undefined);
    setIsLoading(true);
    try {
      const { data } = await apiClient.get<QuizRound>("/movie-quizzes/next");
      setRound(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "퀴즈를 시작하려면 로그인해 주세요."));
      setIsLoginModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAnswer(choice: string) {
    if (!round) return;

    setIsLoading(true);
    try {
      const { data } = await apiClient.post<QuizRound>(`/movie-quizzes/rounds/${round.roundId}/answer`, { choice });
      setRound(data);
      if (data.status === "ACTIVE") {
        setIsRetryModalOpen(true);
      } else {
        setIsResultModalOpen(true);
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "정답을 확인하지 못했어요. 다시 시도해 주세요."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12">
      <section className="overflow-hidden rounded-[2rem] border border-cinemo-gold/30 bg-[radial-gradient(circle_at_top_right,rgba(212,181,106,0.24),transparent_42%),linear-gradient(135deg,rgba(20,59,59,0.85),rgba(9,24,27,1))] p-6 sm:p-10">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-cinemo-gold"><Sparkles aria-hidden="true" className="size-4" />CINEMO QUIZ ROOM</p>
        <h1 className="mt-5 text-3xl font-semibold text-cinemo-text sm:text-5xl">오늘은 어떤 영화를<br />맞혀볼까요?</h1>
        <p className="mt-4 max-w-xl text-cinemo-muted">줄거리와 포스터 단서를 보고 영화 제목을 골라보세요. 첫 정답은 100점이며, 오답 1회당 40점이 차감돼요.</p>
        <div className="mt-7 flex flex-wrap gap-3 text-sm text-cinemo-text">
          <span className="rounded-full bg-cinemo-background/55 px-4 py-2">하루 한 번 기회</span>
          <span className="rounded-full bg-cinemo-background/55 px-4 py-2">최대 2번 선택</span>
          <span className="rounded-full bg-cinemo-background/55 px-4 py-2">오답 1회당 -40점</span>
          <span className="rounded-full bg-cinemo-background/55 px-4 py-2">매주 월요일 순위 초기화</span>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-3xl border border-cinemo-border bg-cinemo-surface p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.24em] text-cinemo-gold">RANDOM QUIZ</p>
            {round ? <span className="text-sm text-cinemo-muted">남은 기회 {round.attemptsRemaining}회</span> : null}
          </div>

          {!round ? (
            <div className="py-10 text-center">
              <HelpCircle aria-hidden="true" className="mx-auto size-11 text-cinemo-gold-light" />
              <h2 className="mt-4 text-xl font-semibold text-cinemo-text">랜덤 영화 퀴즈를 뽑아보세요</h2>
              <p className="mt-2 text-sm text-cinemo-muted">로그인하면 점수와 순위가 저장돼요.</p>
              <button onClick={startRound} disabled={isLoading} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-cinemo-gold px-5 font-semibold text-cinemo-background disabled:opacity-60">
                {isLoading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}퀴즈 뽑기
              </button>
            </div>
          ) : (
            <>
              <div className="mt-7 flex gap-5">
                {round.posterUrl ? (
                  <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-2xl border border-cinemo-gold/25 bg-cinemo-background shadow-lg shadow-black/20">
                    <img src={round.posterUrl} alt="영화 포스터 단서" className="h-full w-full scale-150 object-cover opacity-90 blur-[1px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(9,24,27,0.12),rgba(9,24,27,0.7))]" />
                    <span className="absolute bottom-2 left-2 rounded-full border border-cinemo-gold/40 bg-cinemo-background/80 px-2 py-1 text-[9px] font-semibold tracking-[0.16em] text-cinemo-gold-light">POSTER CLUE</span>
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-[0.2em] text-cinemo-gold">STORY CLUE</p>
                  <p className="mt-3 whitespace-pre-line text-lg leading-8 text-cinemo-text">{round.prompt}</p>
                </div>
              </div>
              {round.status === "ACTIVE" ? (
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {round.choices.map((choice, index) => (
                    <button
                      key={choice}
                      onClick={() => void submitAnswer(choice)}
                      disabled={isLoading}
                      className="group flex min-h-14 items-center gap-3 rounded-xl border border-cinemo-border bg-cinemo-background px-4 text-left text-cinemo-text transition hover:border-cinemo-gold/60 hover:bg-cinemo-gold/10 disabled:opacity-60"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-cinemo-gold/40 text-xs font-semibold text-cinemo-gold-light">{index + 1}</span>
                      <span className="font-medium">{choice}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-7 rounded-2xl border border-cinemo-gold/20 bg-cinemo-background/50 p-5 text-center">
                  <p className="font-semibold text-cinemo-text">이번 퀴즈 결과를 확인했어요.</p>
                  <button onClick={() => setIsResultModalOpen(true)} className="mt-4 text-sm font-medium text-cinemo-gold-light underline underline-offset-4">결과 다시 보기</button>
                </div>
              )}
              {round.status === "ACTIVE" && errorMessage ? <p aria-live="polite" className="mt-4 text-sm text-rose-300">{errorMessage}</p> : null}
            </>
          )}
        </section>

        <aside className="rounded-3xl border border-cinemo-border bg-cinemo-surface p-6">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-cinemo-gold"><Trophy aria-hidden="true" className="size-4" />THIS WEEK</p>
          <h2 className="mt-3 text-xl font-semibold text-cinemo-text">이번 주 퀴즈왕</h2>
          <ol className="mt-5 space-y-3">
            {leaderboard.length ? leaderboard.map((entry) => (
              <li key={`${entry.rank}-${entry.nickname}`} className="flex items-center gap-3 rounded-xl bg-cinemo-background/55 px-3 py-3">
                <span className="w-5 text-center text-sm font-semibold text-cinemo-gold">{entry.rank}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-cinemo-text">{entry.nickname}</span>
                <span className="text-xs text-cinemo-muted">{entry.score}점 · {entry.correctCount}정답</span>
              </li>
            )) : <li className="rounded-xl bg-cinemo-background/55 px-3 py-4 text-sm text-cinemo-muted">이번 주 첫 퀴즈왕이 되어보세요.</li>}
          </ol>
          <p className="mt-5 flex items-center gap-2 text-xs text-cinemo-muted"><Crown aria-hidden="true" className="size-4 text-cinemo-gold" />순위는 매주 월요일에 새로 시작됩니다.</p>
        </aside>
      </div>

      <AppModal
        open={isRetryModalOpen}
        onOpenChange={setIsRetryModalOpen}
        title="TAKE 2"
        showCloseButton={false}
        className="top-[54%] overflow-hidden border-cinemo-gold/35 bg-[radial-gradient(circle_at_50%_-15%,rgba(242,207,130,0.27),transparent_40%),linear-gradient(155deg,#17393a,#0c2024_64%,#10272b)] p-5 shadow-2xl shadow-black/50"
      >
        <div className="relative overflow-hidden px-7 pb-7 pt-8 text-center">
          <span aria-hidden="true" className="absolute left-7 top-7 text-cinemo-gold/70">✦</span>
          <span aria-hidden="true" className="absolute right-8 top-12 text-cinemo-gold/50">✧</span>
          <span className="mx-auto flex size-[4.5rem] items-center justify-center rounded-[1.4rem] border border-rose-200/15 bg-rose-300/10 text-rose-300 shadow-lg shadow-rose-950/20">
            <CircleX aria-hidden="true" className="size-9" strokeWidth={1.8} />
          </span>
          <p className="mt-5 text-xl font-semibold text-cinemo-text">아직 한 장면이 남았어요</p>
          <p className="mt-2 text-sm leading-6 text-cinemo-muted">이번 선택은 정답이 아니에요.<br />다음 선택으로 장면을 이어가 보세요.</p>

          <div className="mx-auto mt-6 flex max-w-xs items-center justify-between rounded-2xl border border-cinemo-gold/20 bg-cinemo-background/35 px-4 py-3 text-left">
            <span className="flex items-center gap-2 text-xs font-medium text-cinemo-gold-light"><Ticket aria-hidden="true" className="size-4" />마지막 도전 티켓</span>
            <span className="flex items-center gap-1.5" aria-label={`남은 기회 ${round?.attemptsRemaining ?? 1}회`}>
              {[0, 1].map((attempt) => <i key={attempt} className={`size-2 rounded-full ${(round?.attemptsRemaining ?? 1) > attempt ? "bg-cinemo-gold" : "bg-cinemo-border"}`} />)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsRetryModalOpen(false)}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d6ae5b] via-[#efd18c] to-[#c99542] px-5 font-semibold text-[#152629] shadow-lg shadow-black/20 transition hover:brightness-110"
          >
            <Sparkles aria-hidden="true" className="size-4" />다시 도전하기
          </button>
          <button type="button" onClick={() => setIsRetryModalOpen(false)} className="mt-4 text-xs text-cinemo-muted transition hover:text-cinemo-text">퀴즈로 돌아가기</button>
        </div>
      </AppModal>

      <AppModal
        open={isResultModalOpen}
        onOpenChange={setIsResultModalOpen}
        title={round?.status === "CORRECT" ? "CORRECT" : "ANSWER REVEAL"}
        className="top-[54%] overflow-hidden border-cinemo-gold/35 bg-[radial-gradient(circle_at_50%_-15%,rgba(242,207,130,0.3),transparent_42%),linear-gradient(155deg,#17393a,#0c2024_64%,#10272b)] p-5 shadow-2xl shadow-black/50"
      >
        {round?.status === "CORRECT" ? (
          <div className="relative overflow-hidden px-7 pb-7 pt-8 text-center">
            <span aria-hidden="true" className="absolute left-8 top-9 text-cinemo-gold/65">✦</span>
            <span aria-hidden="true" className="absolute right-8 top-12 text-cinemo-gold/45">✧</span>
            <span className="mx-auto flex size-[4.5rem] items-center justify-center rounded-[1.4rem] border border-cinemo-gold/30 bg-cinemo-gold/15 text-cinemo-gold-light shadow-lg shadow-black/20"><CircleCheck aria-hidden="true" className="size-9" strokeWidth={1.8} /></span>
            <p className="mt-5 text-xl font-semibold text-cinemo-text">축하해요, 정답이에요!</p>
            <p className="mt-2 text-sm leading-6 text-cinemo-muted">이번 장면을 멋지게 맞혔어요.</p>
            <p className="mx-auto mt-5 inline-flex rounded-full border border-cinemo-gold/25 bg-cinemo-background/35 px-4 py-2 text-sm font-semibold text-cinemo-gold-light">+{round.scoreAwarded}점 획득</p>
            <button type="button" onClick={() => void startRound()} disabled={isLoading} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d6ae5b] via-[#efd18c] to-[#c99542] px-5 font-semibold text-[#152629] shadow-lg shadow-black/20 transition hover:brightness-110 disabled:opacity-60"><Sparkles aria-hidden="true" className="size-4" />다음 퀴즈</button>
          </div>
        ) : (
          <div className="relative overflow-hidden px-7 pb-7 pt-8 text-center">
            <span aria-hidden="true" className="absolute left-8 top-9 text-cinemo-gold/65">✦</span>
            <span aria-hidden="true" className="absolute right-8 top-12 text-cinemo-gold/45">✧</span>
            <span className="mx-auto flex size-[4.5rem] items-center justify-center rounded-[1.4rem] border border-cinemo-gold/25 bg-cinemo-gold/10 text-cinemo-gold-light shadow-lg shadow-black/20"><Ticket aria-hidden="true" className="size-8" /></span>
            <p className="mt-5 text-sm font-medium text-cinemo-muted">이번 장면의 정답</p>
            <p className="mt-2 text-xl font-semibold text-cinemo-text">{round?.answer}</p>
            <p className="mt-4 text-sm leading-6 text-cinemo-muted">두 번의 기회를 모두 사용했어요.<br />오늘의 퀴즈는 여기까지예요.</p>
            <button type="button" onClick={() => setIsResultModalOpen(false)} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl border border-cinemo-gold/35 bg-cinemo-gold/10 px-5 font-semibold text-cinemo-gold-light transition hover:bg-cinemo-gold/20">오늘은 여기까지</button>
          </div>
        )}
      </AppModal>

      <AppModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        title="로그인이 필요해요"
        className="gap-0 rounded-[1.75rem] border-cinemo-gold/30 bg-[#10272b] bg-[radial-gradient(circle_at_50%_-20%,rgba(242,207,130,0.2),transparent_48%)] p-6 shadow-2xl shadow-black/40"
      >
        <div className="mt-5 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cinemo-gold/25 bg-cinemo-gold/10">
            <Trophy aria-hidden="true" className="size-6 text-cinemo-gold-light" />
          </span>
          <p className="mt-4 text-sm leading-6 text-cinemo-muted">로그인하면 퀴즈 점수와 순위를<br />내 기록으로 남길 수 있어요.</p>
          <Link href="/login" className="mt-6 flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#d6ae5b] via-[#efd18c] to-[#c99542] px-5 font-semibold text-[#152629] shadow-lg shadow-black/20 outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cinemo-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-[#10272b]">로그인하고 퀴즈 풀기</Link>
          <button type="button" onClick={() => setIsLoginModalOpen(false)} className="mt-4 text-xs text-cinemo-muted outline-none transition hover:text-cinemo-text focus-visible:text-cinemo-text focus-visible:ring-2 focus-visible:ring-cinemo-gold/60">나중에 할게요</button>
        </div>
      </AppModal>
    </main>
  );
}
