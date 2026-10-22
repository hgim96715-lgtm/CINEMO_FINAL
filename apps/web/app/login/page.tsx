"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export default function LoginPage() {
  const [registered, setRegistered] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRegistered(params.get("registered") === "true");
    setVerified(params.get("verified") === "true");
  }, []);

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

          {registered && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-cinemo-gold/20 bg-cinemo-gold/6 px-3 py-2 text-sm leading-6 text-cinemo-gold-light"
            >
              인증 메일이 발송되었습니다. 이메일을 확인해 회원가입을
              완료해주세요.
            </p>
          )}

          {verified && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-cinemo-gold/20 bg-cinemo-gold/6 px-3 py-2 text-sm leading-6 text-cinemo-gold-light"
            >
              이메일 인증이 완료되었습니다. 로그인해주세요.
            </p>
          )}

        </div>

        <SocialLoginButtons />

        <div className="mb-6 flex items-center gap-3 text-xs text-cinemo-muted">
          <span className="h-px flex-1 bg-white/10" />
          <span>또는</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Link
          href="/email-login"
          className="flex h-12 w-full items-center justify-center rounded-lg bg-cinemo-gold px-4 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
        >
          이메일로 로그인
        </Link>

        <div className="mt-6 flex items-center justify-end text-sm">
          <Link
            href="/register"
            className="font-semibold text-cinemo-gold-light transition hover:text-cinemo-gold"
          >
            회원가입
          </Link>
        </div>
      </section>
    </main>
  );
}
