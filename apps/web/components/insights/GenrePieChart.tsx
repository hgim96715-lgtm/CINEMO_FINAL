"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { movieGenreAnalyticsQueryOptions } from "@/lib/queries/movie-genre-analytics.query";

type GenreBarChartProps = {
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
}: GenreBarChartProps) {
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
        genre: item.genre,
        count: item.count,
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
    <div className="flex w-full min-w-0 flex-col gap-1 mb-2">
      <div
        className={`w-full ${compact ? "h-48 lg:h-72" : "h-56"}`}
        role="img"
        aria-label="이번 달 개봉작 장르 TOP 5"
      >
        <ResponsiveBar
          data={[...chartData].reverse()}
          keys={["count"]}
          indexBy="genre"
          layout="horizontal"
          margin={{ top: 8, right: 48, bottom: 8, left: 72 }}
          padding={0.32}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={(bar) => CHART_COLORS[bar.index % CHART_COLORS.length]}
          borderRadius={4}
          borderColor="rgba(255,255,255,0.2)"
          enableGridX
          enableGridY={false}
          enableLabel
          label={(bar) => `${bar.value}개`}
          labelPosition="end"
          labelOffset={8}
          labelSkipWidth={0}
          labelSkipHeight={0}
          labelTextColor="#f6f3ea"
          axisTop={null}
          axisRight={null}
          axisBottom={null}
          axisLeft={{
            tickSize: 0,
            tickPadding: 10,
            tickRotation: 0,
          }}
          theme={{
            axis: {
              ticks: {
                text: {
                  fill: "#aeb9b8",
                  fontSize: compact ? 11 : 12,
                },
              },
            },
            grid: {
              line: {
                stroke: "rgba(255,255,255,0.08)",
              },
            },
            labels: {
              text: {
                fontSize: 11,
                fontWeight: 600,
              },
            },
          }}
          tooltip={({ color, indexValue, value }) => (
            <div className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-cinemo-gold/40 bg-cinemo-bg px-4 py-2 text-sm font-medium text-cinemo-text shadow-xl">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{indexValue}</span>
              <strong className="text-cinemo-gold-light">{value}개 작품</strong>
            </div>
          )}
          role="img"
        />
      </div>
      <p className="text-right text-[0.65rem] text-cinemo-muted">
        한 작품은 여러 장르에 포함될 수 있습니다.
      </p>
    </div>
  );
}
