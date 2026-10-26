"use client";

import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.3em] text-cinemo-gold">
            CINEMO
          </p>

          <h1 className="mt-4 text-3xl font-bold text-cinemo-text">
            오신 걸 환영해요
          </h1>

          <p className="mt-3 text-sm leading-6 text-cinemo-muted">
            로그인하고 나만의 영화 기록을 이어가세요.
          </p>

        </div>

        <SocialLoginButtons />
      </section>
    </main>
  );
}
