"use client";

import { CinemaRegionMap } from "@/components/lobby/CinemaRegionMap";

type CinemaRegionInsightProps = {
  compact?: boolean;
  selectedRegionCode?: string;
  onRegionSelect?: (regionCode: string) => void;
};

export function CinemaRegionInsight({
  compact = false,
  selectedRegionCode,
  onRegionSelect,
}: CinemaRegionInsightProps) {
  const content = (
    <div className="min-h-0 min-w-0 flex-1">
      <CinemaRegionMap
        compact={compact}
        selectedRegionCode={selectedRegionCode}
        onRegionSelect={onRegionSelect}
      />
    </div>
  );

  if (compact) {
    return <div className="flex min-h-0 w-full flex-1">{content}</div>;
  }

  return (
    <section
      id="cinema-region-map"
      className="rounded-3xl bg-[#132528] p-6 sm:p-8"
    >
      <div className="mb-5">
        <p className="text-sm font-semibold tracking-[0.3em] text-[#d2aa57]">
          CINEMO MAP
        </p>

        <h2 className="mt-3 text-2xl font-bold text-[#f7f1e8] sm:text-3xl">
          우리 지역에는 영화관이 몇 군데 있을까?
        </h2>

        <p className="mt-2 text-sm text-white/60">
          전국 지역별 영화관 수를 비교해보세요.
        </p>
      </div>

      <div className="flex h-[clamp(32rem,72vh,52rem)] min-h-[32rem]">
        {content}
      </div>
    </section>
  );
}
