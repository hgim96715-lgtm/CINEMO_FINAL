"use client";

import { ResponsivePie } from "@nivo/pie";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { movieGenreAnalyticsQueryOptions } from "@/lib/queries/movie-genre-analytics.query";

type GenrePieChartProps = {
  year: number;
  month: number;
  compact?: boolean;
};

const CHART_COLORS = [
  "#d6ad5c",
  "#8ba89d",
  "#b87968",
  "#7184a5",
  "#9b8cba",
] as const;

export function GenrePieChart({
  year,
  month,
  compact = false,
}: GenrePieChartProps) {
  const { data, isPending, isError } = useQuery(
    movieGenreAnalyticsQueryOptions({
      year,
      month,
    }),
  );

  const chartData = useMemo(() => {
    const sorted = [...(data ?? [])]
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        id: item.genre,
        label: item.genre,
        value: item.count,
      }));

    if (sorted.length <= 5) {
      return sorted;
    }

    const topGenres = sorted.slice(0, 5);

    return [...topGenres];
  }, [data]);

  if (isPending) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-cinemo-muted ${
          compact ? "h-40 lg:h-72" : "h-56"
        }`}
      >
        장르 데이터를 불러오는 중...
      </div>
    );
  }

  if (isError || chartData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-cinemo-muted ${
          compact ? "h-40 lg:h-72" : "h-56"
        }`}
      >
        장르 데이터가 없습니다.
      </div>
    );
  }
  return (
    <div
      className={`grid w-full grid-cols-1 items-center ${
        compact
          ? "gap-2 lg:grid-cols-[minmax(0,1fr)_10rem]"
          : "gap-3 md:grid-cols-[minmax(0,1fr)_11rem]"
      }`}
    >
      <div
        className={compact ? "h-40 lg:h-72" : "h-56"}
        role="img"
        aria-label="기간별 장르 구성 비율"
      >
        <ResponsivePie
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          innerRadius={0.62}
          padAngle={1.5}
          cornerRadius={4}
          activeOuterRadiusOffset={6}
          colors={[...CHART_COLORS]}
          borderWidth={1}
          borderColor="rgba(255,255,255,0.2)"
          enableArcLabels={false}
          enableArcLinkLabels={false}
          tooltip={({ datum }) => (
            <div className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-cinemo-gold/40 bg-cinemo-bg px-4 py-2 text-sm font-medium text-cinemo-text shadow-xl">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: datum.color }}
              />
              <span>{datum.label}</span>
              <strong className="text-cinemo-gold-light">
                {datum.value}편
              </strong>
            </div>
          )}
          role="img"
        />
      </div>

      <ul
        className={
          compact
            ? "grid grid-cols-2 gap-x-3 gap-y-1 text-xs lg:block lg:space-y-2"
            : "space-y-2 text-xs"
        }
        aria-label="장르별 영화 수"
      >
        {chartData.map((item, index) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-cinemo-muted">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index] }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 text-cinemo-text">{item.value}편</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
