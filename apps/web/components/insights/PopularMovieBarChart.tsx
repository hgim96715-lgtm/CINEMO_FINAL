"use client";

import { useQuery } from "@tanstack/react-query";
import { movieRankingQueryOptions } from "@/lib/queries/movie-search.query";
import { useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";

type PopularMovieBarDatum = {
  title: string;
  value: number;
  displayValue: string;
};
const COLORS = ["#d6ad5c", "#8ba89d", "#b87968", "#7184a5", "#9b8cba"] as const;

const formatAudience = (value: number | null | undefined) => {
  const count = Number(value);

  if (!Number.isFinite(count)) return "-";

  if (count >= 10_000) {
    const man = Math.round((count / 10_000) * 10) / 10;

    return `${man % 1 === 0 ? man.toFixed(0) : man.toFixed(1)}만`;
  }

  return `${Math.round(count).toLocaleString("ko-KR")}명`;
};

export function PopularMovieBarChart() {
  const { data, isPending, isError } = useQuery(
    movieRankingQueryOptions({ page: 1, limit: 5 }),
  );
  const chartData = useMemo<PopularMovieBarDatum[]>(() => {
    return (data?.items ?? [])
      .map((movie) => ({
        title: movie.title,
        totalAudienceCount: Number(movie.totalAudienceCount),
      }))
      .filter(
        (movie) => movie.title && Number.isFinite(movie.totalAudienceCount),
      )
      .sort((a, b) => b.totalAudienceCount - a.totalAudienceCount)
      .slice(0, 5)
      .map((movie) => ({
        title: movie.title,
        value: movie.totalAudienceCount,
        displayValue: formatAudience(movie.totalAudienceCount),
      }));
  }, [data]);
  if (isPending) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-cinemo-muted lg:h-72">
        인기 영화를 불러오는 중...
      </div>
    );
  }
  if (isError || chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-cinemo-muted lg:h-72">
        인기 영화 데이터가 없습니다.
      </div>
    );
  }
  return (
    <div
      className="h-48 w-full lg:h-72"
      role="img"
      aria-label="현재 인기 영화 TOP 5"
    >
      <ResponsiveBar
        data={[...chartData].reverse()}
        keys={["value"]}
        indexBy="title"
        layout="horizontal"
        margin={{
          top: 8,
          right: 72,
          bottom: 8,
          left: 100,
        }}
        padding={0.28}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={(bar) => COLORS[bar.index % COLORS.length]}
        borderRadius={5}
        enableGridX
        enableGridY={false}
        enableLabel
        label={(bar) => formatAudience(bar.data.value)}
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
          tickPadding: 2,
          tickRotation: 0,
        }}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: "#f6f3ea",
                fontSize: 10,
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
        tooltip={({ color, indexValue, data }) => (
          <div className="rounded-lg border border-cinemo-gold/40 bg-cinemo-bg px-4 py-2 text-sm text-cinemo-text shadow-xl">
            <span
              className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {indexValue}
            <strong className="ml-2 text-cinemo-gold-light">
              {formatAudience(data.value)}
            </strong>
          </div>
        )}
        layers={["grid", "axes", "bars", "markers", "legends"]}
      />
    </div>
  );
}
