"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import { normalizeCinemaRegionCode } from "@/components/lobby/CinemaRegionMap";
import type { CinemaVenue } from "@/lib/api/map";
import { cinemaVenuesQueryOptions } from "@/lib/queries/cinema-venue.query";

type CinemaVenueListProps = {
  region1Code?: string;
  region2Code?: string;
  region3Code?: string;
  brandName?: string;
  onVenueSelect?: (venue: CinemaVenue) => void;
};

function getKakaoMapUrl(
  name: string,
  latitude: number | null,
  longitude: number | null,
) {
  if (latitude === null || longitude === null) {
    return undefined;
  }

  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${latitude},${longitude}`;
}

function getKakaoDirectionsUrl(
  name: string,
  latitude: number | null,
  longitude: number | null,
) {
  if (latitude === null || longitude === null) {
    return undefined;
  }

  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${latitude},${longitude}`;
}

export function CinemaVenueList({
  region1Code,
  region2Code,
  region3Code,
  brandName,
  onVenueSelect,
}: CinemaVenueListProps) {
  const cinemaQuery = useQuery(
    cinemaVenuesQueryOptions({
      region2Code,
      region3Code,
    }),
  );

  if (cinemaQuery.isPending) {
    return <p className="text-cinemo-muted">영화관을 불러오는 중...</p>;
  }

  if (cinemaQuery.isError) {
    return <p className="text-red-300">영화관 정보를 불러오지 못했습니다.</p>;
  }

  const selectedRegionCodes = region1Code?.split(",");
  const regionVenues = selectedRegionCodes
    ? cinemaQuery.data.filter(
        (cinema) =>
          selectedRegionCodes.includes(
            normalizeCinemaRegionCode(cinema.region1Code, cinema.region1Name) ??
              "",
          ),
      )
    : cinemaQuery.data;
  const venues = brandName
    ? regionVenues.filter((cinema) =>
        brandName === "기타"
          ? !cinema.brandName?.trim()
          : cinema.brandName === brandName,
      )
    : regionVenues;

  if (venues.length === 0) {
    return (
      <p className="text-cinemo-muted">해당 지역에 등록된 영화관이 없습니다.</p>
    );
  }

  const isScrollable = venues.length > 3;

  return (
    <ul
      className={`grid gap-3 sm:grid-cols-2 ${
        isScrollable ? "max-h-[36rem] overflow-y-auto pr-2" : ""
      }`}
    >
      {venues.map((cinema) => (
        <li key={cinema.id}>
          <article className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-cinemo-gold/40 hover:bg-white/8">
            <h3 className="font-semibold text-cinemo-text">{cinema.name}</h3>

            {cinema.brandName && (
              <p className="mt-1 text-sm text-cinemo-gold">{cinema.brandName}</p>
            )}

            {cinema.roadAddress && (
              <p className="mt-2 text-sm text-cinemo-muted">
                {cinema.roadAddress}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {(cinema.placeUrl ||
                getKakaoMapUrl(
                  cinema.name,
                  cinema.latitude,
                  cinema.longitude,
                )) && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-cinemo-muted transition hover:border-cinemo-gold/60 hover:text-cinemo-gold-light"
                  onClick={() => onVenueSelect?.(cinema)}
                >
                  <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                  지도에서 보기
                </button>
              )}

              {getKakaoDirectionsUrl(
                cinema.name,
                cinema.latitude,
                cinema.longitude,
              ) && (
                <a
                  href={getKakaoDirectionsUrl(
                    cinema.name,
                    cinema.latitude,
                    cinema.longitude,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cinemo-gold/40 bg-cinemo-gold/10 px-3 py-2 text-xs font-medium text-cinemo-gold transition hover:border-cinemo-gold hover:bg-cinemo-gold/20"
                >
                  <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                  길찾기
                </a>
              )}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
