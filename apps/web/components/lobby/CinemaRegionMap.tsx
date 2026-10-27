"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useEffect, useRef, useState } from "react";

export type CinemaRegion = {
  region1Code: string;
  region1Name: string;
  venueCount: number;
};

type CinemaRegionMapProps = {
  compact?: boolean;
  selectedRegionCode?: string;
  onRegionSelect?: (regionCode: string) => void;
};

type GeographyProperties = {
  code?: string | number;
};

export const CINEMA_REGION_LABELS: Record<string, string> = {
  "11": "서울특별시",
  "26": "부산광역시",
  "27": "대구광역시",
  "28": "인천광역시",
  "29": "전남광주통합특별시",
  "30": "대전광역시",
  "31": "울산광역시",
  "36": "세종특별자치시",
  "41": "경기도",
  "42": "강원특별자치도",
  "43": "충청북도",
  "44": "충청남도",
  "45": "전북특별자치도",
  "46": "전남광주통합특별시",
  "47": "경상북도",
  "48": "경상남도",
  "50": "제주특별자치도",
};

export const INTEGRATED_GWANGJU_JEONNAM_CODE = "29,46";
const INTEGRATED_GWANGJU_JEONNAM_CODES = new Set(["29", "46"]);

// KOSTAT 지도 GeoJSON 코드와 영화관 API의 행정구역 코드가 다름
const GEO_CODE_TO_CINEMA_REGION_CODE: Record<string, string> = {
  "11": "11",
  "21": "26",
  "22": "27",
  "23": "28",
  "24": "29",
  "25": "30",
  "26": "31",
  "29": "36",
  "31": "41",
  "32": "42",
  "33": "43",
  "34": "44",
  "35": "45",
  "36": "46",
  "37": "47",
  "38": "48",
  "39": "50",
};

const REGION_CODE_BY_NAME: Array<[string, string]> = [
  ["서울", "11"],
  ["부산", "26"],
  ["대구", "27"],
  ["인천", "28"],
  ["광주", "29"],
  ["대전", "30"],
  ["울산", "31"],
  ["세종", "36"],
  ["경기", "41"],
  ["강원", "42"],
  ["충북", "43"],
  ["충남", "44"],
  ["전북", "45"],
  ["전남", "46"],
  ["경북", "47"],
  ["경남", "48"],
  ["제주", "50"],
];

/** DB에 남아 있을 수 있는 이전 코드·지역명을 지도 기준 코드로 통일함 */
export function normalizeCinemaRegionCode(
  region1Code: string | null | undefined,
  region1Name: string | null | undefined,
): string | null {
  const normalizedName = region1Name?.replace(/\s/g, "") ?? "";
  const matchedCode = REGION_CODE_BY_NAME.find(([name]) =>
    normalizedName.includes(name),
  )?.[1];

  if (matchedCode) {
    return matchedCode;
  }

  if (!region1Code) {
    return null;
  }

  return CINEMA_REGION_LABELS[region1Code]
    ? region1Code
    : (GEO_CODE_TO_CINEMA_REGION_CODE[region1Code] ?? region1Code);
}

const REGION_FILL_COLORS: Record<string, string> = {
  "11": "#65566a",
  "26": "#6d5a43",
  "27": "#4f6475",
  "28": "#4f6c68",
  "29,46": "#805c52",
  "30": "#5e704d",
  "31": "#6f5b78",
  "36": "#4b7773",
  "41": "#756345",
  "42": "#596b7b",
  "43": "#725a70",
  "44": "#6c5b49",
  "45": "#557467",
  "47": "#5b704e",
  "48": "#7a614f",
  "50": "#536d7e",
};

export function CinemaRegionMap({
  compact = false,
  selectedRegionCode,
  onRegionSelect,
}: CinemaRegionMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapWidth, setMapWidth] = useState(0);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setMapWidth(entry.contentRect.width);
    });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const isMobileMap = mapWidth > 0 && mapWidth < 640;
  const projectionScale = compact ? 4800 : isMobileMap ? 8200 : 5400;
  const getRegionColor = (code: string) => {
    const cinemaRegionCode = INTEGRATED_GWANGJU_JEONNAM_CODES.has(code)
      ? INTEGRATED_GWANGJU_JEONNAM_CODE
      : code;

    return REGION_FILL_COLORS[cinemaRegionCode] ?? "#405458";
  };

  return (
    <div
      ref={mapContainerRef}
      className={`relative h-full w-full ${compact ? "min-h-0" : "min-h-80"}`}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: projectionScale,
          center: [127.8, 35.8],
        }}
        className="h-full w-full"
        style={{ overflow: "hidden" }}
        aria-label="전국 지역별 영화관 수 지도"
      >
        <Geographies geography="/maps/korea-provinces.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const properties = geo.properties as GeographyProperties;
              const geoRegionCode = String(properties.code ?? "");
              const regionCode =
                GEO_CODE_TO_CINEMA_REGION_CODE[geoRegionCode] ?? geoRegionCode;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getRegionColor(regionCode)}
                  stroke={
                    selectedRegionCode === regionCode ||
                    (selectedRegionCode === INTEGRATED_GWANGJU_JEONNAM_CODE &&
                      INTEGRATED_GWANGJU_JEONNAM_CODES.has(regionCode))
                      ? "#e3bd67"
                      : "#294244"
                  }
                  strokeWidth={
                    selectedRegionCode === regionCode ||
                    (selectedRegionCode === INTEGRATED_GWANGJU_JEONNAM_CODE &&
                      INTEGRATED_GWANGJU_JEONNAM_CODES.has(regionCode))
                      ? 1.8
                      : 0.8
                  }
                  onClick={() =>
                    onRegionSelect?.(
                      INTEGRATED_GWANGJU_JEONNAM_CODES.has(regionCode)
                        ? INTEGRATED_GWANGJU_JEONNAM_CODE
                        : regionCode,
                    )
                  }
                  style={{
                    outline: "none",
                    cursor: onRegionSelect ? "pointer" : "default",
                  }}
                />
              );
            })
          }
        </Geographies>

      </ComposableMap>
    </div>
  );
}
