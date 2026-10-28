import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

export function CinemaMapButton() {
  return (
    <div className="mt-6">
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
