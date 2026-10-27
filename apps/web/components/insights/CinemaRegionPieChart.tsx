"use client";

import { ResponsivePie } from "@nivo/pie";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  CinemaRegion,
  INTEGRATED_GWANGJU_JEONNAM_CODE,
} from "@/components/lobby/CinemaRegionMap";
import { cinemaVenuesQueryOptions } from "@/lib/queries/cinema-venue.query";

type CinemaRegionPieChartProps = {
  compact?: boolean;
};

type CinemaRegionPieDatum = {
  id: string;
  label: string;
  value: number;
};

const PIE_COLORS = [
  "#d6ad5c",
  "#8ba89d",
  "#b87968",
  "#7184a5",
  "#9b8cba",
  "#7f9d9b",
  "#c98d72",
  "#8f7659",
  "#667c8e",
  "#9b6c7a",
] as const;

function toRegions(
  venues: Array<{
    region1Code?: string | null;
    region1Name?: string | null;
  }>,
) {
  return Array.from(
    venues.reduce((map, venue) => {
      if (!venue.region1Code || !venue.region1Name) {
        return map;
      }

      const existing = map.get(venue.region1Code);

      map.set(venue.region1Code, {
        region1Code: venue.region1Code,
        region1Name: venue.region1Name,
        venueCount: (existing?.venueCount ?? 0) + 1,
      });

      return map;
    }, new Map<string, CinemaRegion>()),
  ).map(([, region]) => region);
}

export function CinemaRegionPieChart({
  compact = false,
}: CinemaRegionPieChartProps) {
  const {
    data: venues = [],
    isPending,
    isError,
  } = useQuery(cinemaVenuesQueryOptions());

  const chartData = useMemo<CinemaRegionPieDatum[]>(() => {
    const groupedRegions = toRegions(venues).reduce((map, region) => {
      const isIntegratedRegion = ["29", "46"].includes(region.region1Code);
      const region1Code = isIntegratedRegion
        ? INTEGRATED_GWANGJU_JEONNAM_CODE
        : region.region1Code;
      const existing = map.get(region1Code);

      map.set(region1Code, {
        region1Code,
        region1Name: isIntegratedRegion
          ? "전남광주통합특별시"
          : region.region1Name,
        venueCount: (existing?.venueCount ?? 0) + region.venueCount,
      });

      return map;
    }, new Map<string, CinemaRegion>());

    const regions = [...groupedRegions.values()]
      .sort((a, b) => b.venueCount - a.venueCount)
      .map((region) => ({
        id: region.region1Code,
        label: region.region1Name,
        value: region.venueCount,
      }));

    return regions.slice(0, 5);
  }, [venues]);

  if (isPending) {
    return (
      <div className="flex h-full min-h-44 flex-1 items-center justify-center text-sm text-cinemo-muted">
        영화관 데이터를 불러오는 중...
      </div>
    );
  }

  if (isError || chartData.length === 0) {
    return (
      <div className="flex h-full min-h-44 flex-1 items-center justify-center text-sm text-cinemo-muted">
        영화관 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 items-center gap-3 sm:gap-6">
      <div
        className={`relative h-52 min-w-0 flex-[1.1] shrink-0 ${compact ? "sm:h-60" : "sm:h-64"}`}
        role="img"
        aria-label="영화관이 많은 지역 TOP 5"
      >
        <ResponsivePie
          data={chartData}
          id="id"
          value="value"
          innerRadius={0.58}
          padAngle={1.5}
          cornerRadius={4}
          activeOuterRadiusOffset={4}
          colors={PIE_COLORS as unknown as string[]}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.45]] }}
          isInteractive={false}
          // enableArcLabels
          // arcLabel={(datum) => `${datum.value}곳`}
          arcLabelsSkipAngle={12}
          arcLabelsTextColor="#f6f3ea"
          // enableArcLinkLabels={false}
          margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
          // theme={{
          //   labels: {
          //     text: {
          //       fontSize: compact ? 10 : 11,
          //       fontWeight: 700,
          //     },
          //   },
          // }}
          layers={["arcs", "arcLabels"]}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 text-[0.65rem] leading-tight text-cinemo-muted sm:gap-2 sm:text-xs">
        {chartData.map((item, index) => (
          <span
            key={item.id}
            className="inline-flex min-w-0 items-start gap-1.5"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
            />
            <span className="min-w-0">
              {item.label} {item.value}곳
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
