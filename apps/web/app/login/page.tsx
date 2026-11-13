"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

type LoginIntent = "favorite" | "watched" | "rating" | "comment";

const loginIntentCopy: Record<
  LoginIntent,
  { title: string; description: string }
> = {
  favorite: {
    title: "찜한 영화를 모아볼까요?",
    description: "로그인하면 보고 싶은 영화를 나만의 목록에 저장할 수 있습니다.",
  },
  watched: {
    title: "오늘 본 영화를 기록할까요?",
    description: "로그인하면 관람 날짜와 감상을 내 시네마에 차곡차곡 남길 수 있습니다.",
  },
  rating: {
    title: "내 평점을 남겨볼까요?",
    description: "로그인하면 영화마다 나만의 별점과 관람 기록을 저장할 수 있습니다.",
  },
  comment: {
    title: "감상을 나누려면 로그인이 필요합니다",
    description: "로그인하고 좋아하는 영화 이야기에 댓글과 답글을 남겨보세요.",
  },
};

const isLoginIntent = (value: string | null): value is LoginIntent =>
  value === "favorite" ||
  value === "watched" ||
  value === "rating" ||
  value === "comment";

function LoginPageContent() {
  const intent = useSearchParams().get("intent");
  const copy = isLoginIntent(intent)
    ? loginIntentCopy[intent]
    : {
        title: "오신 걸 환영해요",
        description: "로그인하고 나만의 영화 기록을 이어가세요.",
      };

  return (
    <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.3em] text-cinemo-gold">
            CINEMO
          </p>

          <h1 className="mt-4 text-3xl font-bold text-cinemo-text">
            {copy.title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-cinemo-muted">
            {copy.description}
          </p>

        </div>

        <SocialLoginButtons />
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
          <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="mt-6 h-9 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-5 w-full animate-pulse rounded bg-white/10" />
          </section>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
