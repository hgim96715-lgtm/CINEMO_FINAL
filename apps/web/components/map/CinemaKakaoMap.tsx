"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import type { CinemaVenue } from "@/lib/api/map";

type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (position: KakaoLatLng) => void;
};

type KakaoMap = {
  setCenter: (position: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  setBounds: (bounds: KakaoLatLngBounds, padding?: number) => void;
};

type KakaoLatLngBounds = {
  extend: (position: KakaoLatLng) => void;
};

type KakaoInfoWindow = {
  open: (map: KakaoMap, marker: KakaoMarker) => void;
  close: () => void;
  setContent: (content: string) => void;
};

type KakaoMaps = {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  LatLngBounds: new () => KakaoLatLngBounds;
  Marker: new (options: {
    map: KakaoMap;
    position: KakaoLatLng;
    title: string;
  }) => KakaoMarker;
  InfoWindow: new (options: {
    content: string;
    removable?: boolean;
  }) => KakaoInfoWindow;
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

type CinemaKakaoMapProps = {
  venues: CinemaVenue[];
  selectedVenueId?: string;
};

const DEFAULT_CENTER = { latitude: 35.8, longitude: 127.8 };

function getValidVenues(venues: CinemaVenue[]) {
  return venues.filter(
    (venue) => venue.latitude !== null && venue.longitude !== null,
  );
}

function getInfoWindowContent(venue: CinemaVenue) {
  const address = venue.roadAddress ?? "주소 정보 없음";

  return `<div style="padding:10px 14px;color:#193033;background:#fff;border-radius:8px;min-width:170px;font-size:13px;line-height:1.5;box-shadow:0 2px 8px rgba(0,0,0,.18)">
    <strong style="display:block;font-size:14px">${venue.name}</strong>
    <span>${address}</span>
  </div>`;
}

export function CinemaKakaoMap({
  venues,
  selectedVenueId,
}: CinemaKakaoMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const infoWindowRef = useRef<KakaoInfoWindow | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isSdkError, setIsSdkError] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

  useEffect(() => {
    if (!isSdkReady || !mapElementRef.current || !window.kakao?.maps) {
      return;
    }

    const maps = window.kakao.maps;

    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapElementRef.current, {
        center: new maps.LatLng(
          DEFAULT_CENTER.latitude,
          DEFAULT_CENTER.longitude,
        ),
        level: 13,
      });
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();

    const validVenues = getValidVenues(venues);
    const markersByVenueId = new Map<string, KakaoMarker>();
    const bounds = new maps.LatLngBounds();

    validVenues.forEach((venue) => {
      const position = new maps.LatLng(venue.latitude!, venue.longitude!);
      bounds.extend(position);
      const marker = new maps.Marker({
        map: mapRef.current!,
        position,
        title: venue.name,
      });

      markersRef.current.push(marker);
      markersByVenueId.set(venue.id, marker);
    });

    const selectedVenue = validVenues.find(
      (venue) => venue.id === selectedVenueId,
    );

    if (selectedVenue) {
      const selectedPosition = new maps.LatLng(
        selectedVenue.latitude!,
        selectedVenue.longitude!,
      );
      mapRef.current.setCenter(selectedPosition);
      mapRef.current.setLevel(4);

      const selectedMarker = markersByVenueId.get(selectedVenue.id);
      if (selectedMarker) {
        const infoWindow = new maps.InfoWindow({
          content: getInfoWindowContent(selectedVenue),
          removable: true,
        });
        infoWindow.open(mapRef.current, selectedMarker);
        infoWindowRef.current = infoWindow;
      }
    } else if (validVenues.length > 0) {
      mapRef.current.setBounds(bounds, 48);
    }
  }, [isSdkReady, selectedVenueId, venues]);

  if (!appKey) {
    return (
      <div className="flex h-full min-h-80 items-center justify-center bg-[#e8f0ec] px-6 text-center text-sm text-[#193033]">
        카카오 지도 JavaScript 키가 설정되지 않았음
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-80 overflow-hidden bg-[#e8f0ec]">
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          if (!window.kakao?.maps) {
            setIsSdkError(true);
            return;
          }

          window.kakao.maps.load(() => setIsSdkReady(true));
        }}
        onError={() => setIsSdkError(true)}
      />

      <div ref={mapElementRef} className="h-full min-h-80 w-full" />

      {isSdkError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#e8f0ec] px-6 text-center text-sm text-[#193033]">
          카카오 지도를 불러오지 못했음
        </div>
      )}
    </div>
  );
}
