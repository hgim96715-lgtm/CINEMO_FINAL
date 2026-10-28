"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { CinemaRegionInsight } from "@/components/lobby/CinemaRegionInsight";
import {
  CINEMA_REGION_LABELS,
  INTEGRATED_GWANGJU_JEONNAM_CODE,
  normalizeCinemaRegionCode,
} from "@cinemo/shared";
import { CinemaRegion2Select } from "@/components/map/CinemaRegion2Select";
import { CinemaRegionSelect } from "@/components/map/CinemaRegionSelect";
import { CinemaKakaoMap } from "@/components/map/CinemaKakaoMap";
import { CinemaVenueList } from "@/components/map/CinemaVenueList";
import type { CinemaVenue } from "@/lib/api/map";
import { cinemaVenuesQueryOptions } from "@/lib/queries/cinema-venue.query";

export default function CinemaVenuesPage() {
  const detailsRef = useRef<HTMLElement>(null);
  const [region1Code, setRegion1Code] = useState<string>();
  const [region2Code, setRegion2Code] = useState<string>();
  const [brandName, setBrandName] = useState<string>();
  const [selectedVenue, setSelectedVenue] = useState<CinemaVenue>();
  const isIntegratedGwangjuJeonnam =
    region1Code === INTEGRATED_GWANGJU_JEONNAM_CODE;

  const selectedVenuesQuery = useQuery(
    cinemaVenuesQueryOptions(),
  );

  const selectedVenues = (selectedVenuesQuery.data ?? []).filter((venue) => {
    if (!region1Code) {
      return true;
    }

    const normalizedRegionCode = normalizeCinemaRegionCode(
      venue.region1Code,
      venue.region1Name,
    );

    const matchesRegion1 = isIntegratedGwangjuJeonnam
      ? ["29", "46"].includes(normalizedRegionCode ?? "")
      : normalizedRegionCode === region1Code;

    if (!matchesRegion1) {
      return false;
    }

    return region2Code ? venue.region2Code === region2Code : true;
  });

  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const venue of selectedVenues) {
      const brand = venue.brandName?.trim() || "기타";
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [selectedVenues]);

  const mapVenues = selectedVenues.filter((venue) => {
    const matchesBrand = brandName
      ? brandName === "기타"
        ? !venue.brandName?.trim()
        : venue.brandName === brandName
      : true;

    return matchesBrand;
  });

  const handleRegion1Change = (nextRegion1Code?: string) => {
    setRegion1Code(nextRegion1Code);
    setRegion2Code(undefined);
    setBrandName(undefined);
    setSelectedVenue(undefined);
  };

  const handleRegionSelect = (nextRegion1Code: string) => {
    handleRegion1Change(nextRegion1Code);

    window.requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const selectedRegionName = region1Code
    ? isIntegratedGwangjuJeonnam
      ? "전남광주통합특별시"
      : CINEMA_REGION_LABELS[region1Code] ??
        "선택 지역"
    : "전국";

  const selectedRegion2Name = region2Code
    ? (selectedVenuesQuery.data ?? []).find(
        (venue) => venue.region2Code === region2Code,
      )?.region2Name
    : undefined;

  const selectedAreaName = selectedRegion2Name
    ? `${selectedRegionName} ${selectedRegion2Name}`
    : selectedRegionName;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-12">
      <header className="mb-8">
        <p className="text-sm tracking-[0.3em] text-cinemo-gold">CINEMA MAP</p>

        <h1 className="mt-3 text-3xl font-semibold text-cinemo-text">
          전국 영화관 찾기
        </h1>

        <p className="mt-3 text-cinemo-muted">
          시·도와 시·군·구를 선택해 영화관을 찾아보세요.
        </p>
      </header>

      <section className="space-y-6">
        <CinemaRegionInsight
          selectedRegionCode={region1Code}
          onRegionSelect={handleRegionSelect}
        />

        <div className="flex flex-wrap gap-3">
          <CinemaRegionSelect
            value={region1Code}
            onChange={handleRegion1Change}
          />

          <CinemaRegion2Select
            region1Code={isIntegratedGwangjuJeonnam ? undefined : region1Code}
            value={region2Code}
            onChange={setRegion2Code}
          />
        </div>

        <section
          ref={detailsRef}
          id="cinema-region-details"
          className="scroll-mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm tracking-[0.2em] text-cinemo-gold">
                {selectedAreaName}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-cinemo-text">
                {selectedAreaName} 영화관 {selectedVenues.length}곳
              </h2>
            </div>

            {region1Code && brandCounts.length > 0 && (
              <p className="text-sm text-cinemo-muted">
                브랜드를 선택하면 상세 목록을 확인할 수 있습니다.
              </p>
            )}
          </div>

          {region1Code && brandCounts.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBrandName(undefined)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  !brandName
                    ? "border-cinemo-gold bg-cinemo-gold/15 text-cinemo-gold-light"
                    : "border-white/10 bg-white/5 text-cinemo-muted hover:border-cinemo-gold/50"
                }`}
              >
                전체 {selectedVenues.length}곳
              </button>

              {brandCounts.map(([brand, count]) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setBrandName(brand)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    brandName === brand
                      ? "border-cinemo-gold bg-cinemo-gold/15 text-cinemo-gold-light"
                      : "border-white/10 bg-white/5 text-cinemo-muted hover:border-cinemo-gold/50"
                  }`}
                >
                  {brand} {count}곳
                </button>
              ))}
            </div>
          )}
        </section>

        <section
          id="kakao-cinema-map"
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 sm:p-3"
        >
          <div className="mb-3 px-2">
            <p className="text-sm tracking-[0.2em] text-cinemo-gold">
              KAKAO MAP
            </p>
            <h2 className="mt-2 text-xl font-semibold text-cinemo-text">
              {selectedAreaName} 영화관 위치
            </h2>
          </div>
          <div className="h-[min(60vh,520px)] min-h-[340px] overflow-hidden rounded-2xl">
            <CinemaKakaoMap
              venues={mapVenues}
              selectedVenueId={selectedVenue?.id}
            />
          </div>
        </section>

        <CinemaVenueList
          region1Code={region1Code}
          region2Code={region2Code}
          brandName={brandName}
          onVenueSelect={(venue) => {
            setSelectedVenue(venue);
            document.getElementById("kakao-cinema-map")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        />
      </section>
    </main>
  );
}
