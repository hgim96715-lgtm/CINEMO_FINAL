import { useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { Topology } from "topojson-specification";

import {
  CINEMA_REGION_COLORS,
  CINEMO_COLORS,
  GEO_CODE_TO_CINEMA_REGION_CODE,
  INTEGRATED_GWANGJU_JEONNAM_CODE,
  INTEGRATED_GWANGJU_JEONNAM_CODES,
} from "@cinemo/shared";

import koreaTopology from "@cinemo/shared/maps/korea-provinces.json";

type RegionProperties = GeoJsonProperties & {
  code?: string | number;
};

type CinemaRegionMapProps = {
  selectedRegionCode?: string;
  onRegionSelect?: (regionCode: string) => void;
};

const topology = koreaTopology as unknown as Topology;

function getRegionCode(geoCode: string) {
  const cinemaRegionCode = GEO_CODE_TO_CINEMA_REGION_CODE[geoCode] ?? geoCode;

  if (INTEGRATED_GWANGJU_JEONNAM_CODES.has(cinemaRegionCode)) {
    return INTEGRATED_GWANGJU_JEONNAM_CODE;
  }

  return cinemaRegionCode;
}

function getRegionColor(regionCode: string) {
  return CINEMA_REGION_COLORS[regionCode] ?? "#405458";
}

export function CinemaRegionMap({
  selectedRegionCode,
  onRegionSelect,
}: CinemaRegionMapProps) {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  const regions = useMemo(() => {
    const mapObject = topology.objects.skorea_provinces_2018_geo;

    const result = feature(topology, mapObject) as unknown as FeatureCollection<
      Geometry,
      RegionProperties
    >;

    return result.features;
  }, []);

  const projection = useMemo(() => {
    if (size.width === 0 || size.height === 0) {
      return null;
    }

    return geoMercator().fitSize([size.width, size.height], {
      type: "FeatureCollection",
      features: regions,
    });
  }, [regions, size]);

  const pathGenerator = useMemo(() => {
    if (!projection) {
      return null;
    }

    return geoPath(projection);
  }, [projection]);

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;

    setSize({
      width,
      height,
    });
  }

  return (
    <View
      onLayout={handleLayout}
      className="h-[420px] w-full bg-cinemo-bg-deep"
    >
      {size.width > 0 && pathGenerator ? (
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {regions.map((region, index) => {
            const geoCode = String(region.properties?.code ?? "");

            const regionCode = getRegionCode(geoCode);

            const path = pathGenerator(region);

            if (!path) {
              return null;
            }

            const isSelected = selectedRegionCode === regionCode;

            return (
              <Path
                key={`${regionCode}-${index}`}
                d={path}
                fill={getRegionColor(regionCode)}
                fillOpacity={1}
                stroke={
                  isSelected
                    ? CINEMO_COLORS.accentLight
                    : CINEMO_COLORS.borderSubtle
                }
                strokeWidth={isSelected ? 2 : 0.8}
                onPress={() => {
                  onRegionSelect?.(regionCode);
                }}
              />
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}
