"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useEffect, useRef, useState } from "react";
import koreaProvinces from "@cinemo/shared/maps/korea-provinces.json";
import {
  CINEMA_REGION_COLORS,
  GEO_CODE_TO_CINEMA_REGION_CODE,
  INTEGRATED_GWANGJU_JEONNAM_CODE,
  INTEGRATED_GWANGJU_JEONNAM_CODES,
  normalizeCinemaRegionCode,
} from "@cinemo/shared";
export {
  INTEGRATED_GWANGJU_JEONNAM_CODE,
  normalizeCinemaRegionCode,
} from "@cinemo/shared";
export type { CinemaRegion } from "@cinemo/shared";

type CinemaRegionMapProps = {
  compact?: boolean;
  selectedRegionCode?: string;
  onRegionSelect?: (regionCode: string) => void;
};

type GeographyProperties = {
  code?: string | number;
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

    return CINEMA_REGION_COLORS[cinemaRegionCode] ?? "#405458";
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
        <Geographies geography={koreaProvinces as never}>
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
