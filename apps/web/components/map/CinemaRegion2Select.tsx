"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { CinemaSelect } from "@/components/map/CinemaSelect";
import { cinemaVenuesQueryOptions } from "@/lib/queries/cinema-venue.query";

type CinemaRegion2SelectProps = {
  region1Code?: string;
  value?: string;
  onChange: (region2Code?: string) => void;
};

export function CinemaRegion2Select({
  region1Code,
  value,
  onChange,
}: CinemaRegion2SelectProps) {
  const cinemaQuery = useQuery(
    cinemaVenuesQueryOptions({
      region1Code,
    }),
  );

  const regions = useMemo(() => {
    const regionMap = new Map<string, string>();

    for (const cinema of cinemaQuery.data ?? []) {
      if (cinema.region2Code && cinema.region2Name) {
        regionMap.set(cinema.region2Code, cinema.region2Name);
      }
    }

    return [...regionMap.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], "ko"),
    );
  }, [cinemaQuery.data]);

  if (!region1Code || regions.length === 0) {
    return null;
  }

  return (
    <CinemaSelect
      value={value ?? ""}
      options={[
        { value: "", label: "전체 지역" },
        ...regions.map(([code, name]) => ({ value: code, label: name })),
      ]}
      onChange={(nextValue) => onChange(nextValue || undefined)}
      ariaLabel="시·군·구 선택"
    />
  );
}
