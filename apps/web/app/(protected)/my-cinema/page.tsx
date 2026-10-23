import Image from "next/image";
import { UserRound } from "lucide-react";

import { requireUser } from "@/lib/auth/server";
import { MyCinemaTabs } from "@/components/my-cinema/MyCinemaTabs";
import { MyCinemaStats } from "@/components/my-cinema/MyCinemaStats";

export default async function MyCinemaPage() {
  const user = await requireUser();

  return (
    <main className="relative isolate min-h-[calc(100vh-11rem)] overflow-hidden px-6 py-12 sm:py-16">
      <div className="pointer-events-none absolute -left-32 top-16 -z-10 size-80 rounded-full bg-cinemo-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-56 -z-10 size-96 rounded-full bg-cyan-400/5 blur-3xl" />

      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold tracking-[0.32em] text-cinemo-gold">
            MY CINEMA
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-cinemo-text sm:text-4xl">
            나만의 영화 공간
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-cinemo-muted sm:text-base">
            좋아하는 영화와 인물을 저장하고, 나만의 시네마를 만들어가는 공간
          </p>
        </header>

        <section className="rounded-2xl border border-white/15 bg-[#101f21] p-6 sm:p-8">
          <div className="flex flex-row items-center gap-4 sm:gap-6">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cinemo-gold/60 bg-white/5 p-1 sm:size-20">
              <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-cinemo-bg/60">
                {user.profileImageUrl ? (
                  <Image
                    src={user.profileImageUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-7 text-cinemo-muted sm:size-9" />
                )}
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-[0.2em] text-cinemo-gold-light">
                CINEMO MEMBER
              </p>
              <h2 className="mt-2 truncate text-xl font-bold text-cinemo-text sm:text-2xl">
                {user.nickname}의 영화 공간
              </h2>
              <p className="mt-2 truncate text-sm text-cinemo-muted">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/55">
            나만의 영화 기록을 차곡차곡 쌓아보세요.
          </div>
        </section>

        <MyCinemaStats />

        <MyCinemaTabs />
      </div>
    </main>
  );
}
