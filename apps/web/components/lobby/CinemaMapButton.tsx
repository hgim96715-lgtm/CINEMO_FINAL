import Link from "next/link";
import { ArrowUpRight, HelpCircle, MapPin } from "lucide-react";

export function CinemaMapButton() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <Link
        href="/lobby/quizzes"
        className="flex items-center justify-between rounded-2xl border border-cinemo-gold/25 bg-cinemo-gold/10 px-4 py-4 transition hover:bg-cinemo-gold/15"
      >
        <span className="flex items-center">
          <HelpCircle aria-hidden="true" className="size-5 text-cinemo-gold-light" />
          <span className="ml-3">
            <span className="block font-semibold text-cinemo-text">랜덤 영화 퀴즈</span>
            <span className="mt-1 block text-xs text-cinemo-muted">두 번의 기회로 영화 제목 맞히기</span>
          </span>
        </span>
        <ArrowUpRight aria-hidden="true" className="size-5 text-cinemo-gold-light" />
      </Link>
      <Link
        href="/lobby/cinemas"
        className="flex items-center justify-between rounded-2xl bg-cinemo-surface px-4 py-4 transition hover:bg-cinemo-surface/80"
      >
        <span className="flex items-center">
          <MapPin aria-hidden="true" className="size-5 text-cinemo-gold-light" />

          <span className="ml-3">
            <span className="block font-semibold text-cinemo-text">
              전국 영화관 찾기
            </span>
            <span className="mt-1 block text-xs text-cinemo-muted">
              지역별 영화관 위치와 개수 확인
            </span>
          </span>
        </span>

        <ArrowUpRight
          aria-hidden="true"
          className="size-5 text-cinemo-gold-light"
        />
      </Link>
    </div>
  );
}
