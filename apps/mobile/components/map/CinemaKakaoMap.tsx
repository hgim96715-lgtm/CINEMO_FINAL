import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import type { CinemaVenue } from "@/lib/api/map";

type CinemaKakaoMapProps = {
  venues: CinemaVenue[];
  selectedVenueId?: string;
  onVenueSelect?: (venueId: string) => void;
};

const DEFAULT_CENTER = {
  latitude: 35.8,
  longitude: 127.8,
};

function escapeHtmlJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function createMapHtml(appKey: string, venues: CinemaVenue[]) {
  const validVenues = venues.filter(
    (venue) => venue.latitude !== null && venue.longitude !== null,
  );

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      * { box-sizing: border-box; }
      html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
      body { overflow: hidden; background: #e8f0ec; }
      .empty { display: flex; height: 100%; align-items: center; justify-content: center; color: #193033; font: 14px -apple-system, BlinkMacSystemFont, sans-serif; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false"></script>
    <script>
      const venues = ${escapeHtmlJson(validVenues)};
      const defaultCenter = ${escapeHtmlJson(DEFAULT_CENTER)};
      let map;
      let markers = new Map();
      let infoWindow;

      function post(message) {
        window.ReactNativeWebView?.postMessage(JSON.stringify(message));
      }

      function infoContent(venue) {
        const address = venue.roadAddress || '주소 정보 없음';
        const escapeHtml = (value) => String(value).replace(/[&<>\"]/g, (character) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '\"': '&quot;',
        })[character]);
        return '<div style="padding:10px 12px;min-width:170px;color:#193033;background:#fff;border-radius:8px;font:13px -apple-system,BlinkMacSystemFont,sans-serif;line-height:1.45;box-shadow:0 2px 8px rgba(0,0,0,.18)">' +
          '<strong style="display:block;font-size:14px">' + escapeHtml(venue.name) + '</strong>' +
          '<span>' + escapeHtml(address) + '</span></div>';
      }

      function focusVenue(venueId) {
        const venue = venues.find((item) => item.id === venueId);
        const marker = markers.get(venueId);
        if (!venue || !marker || !map) return;

        const position = marker.getPosition();
        map.setCenter(position);
        map.setLevel(4);
        infoWindow?.close();
        infoWindow = new kakao.maps.InfoWindow({
          content: infoContent(venue),
          removable: true,
        });
        infoWindow.open(map, marker);
      }

      window.focusCinemaVenue = focusVenue;

      function init() {
        if (!window.kakao?.maps) {
          post({ type: 'error' });
          return;
        }

        const center = new kakao.maps.LatLng(defaultCenter.latitude, defaultCenter.longitude);
        map = new kakao.maps.Map(document.getElementById('map'), {
          center,
          level: 13,
        });

        if (venues.length === 0) {
          document.getElementById('map').innerHTML = '<div class="empty">표시할 영화관 위치가 없음</div>';
          return;
        }

        const bounds = new kakao.maps.LatLngBounds();
        venues.forEach((venue) => {
          const position = new kakao.maps.LatLng(venue.latitude, venue.longitude);
          bounds.extend(position);
          const marker = new kakao.maps.Marker({
            map,
            position,
            title: venue.name,
          });
          markers.set(venue.id, marker);
          kakao.maps.event.addListener(marker, 'click', () => {
            post({ type: 'select', venueId: venue.id });
            focusVenue(venue.id);
          });
        });

        map.setBounds(bounds, 48);
      }

      if (window.kakao?.maps) {
        window.kakao.maps.load(init);
      } else {
        post({ type: 'error' });
      }
    </script>
  </body>
</html>`;
}

export function CinemaKakaoMap({
  venues,
  selectedVenueId,
  onVenueSelect,
}: CinemaKakaoMapProps) {
  const webViewRef = useRef<WebView>(null);
  const [isSdkError, setIsSdkError] = useState(false);
  const appKey = process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY;
  const mapHtml = useMemo(
    () => (appKey ? createMapHtml(appKey, venues) : ""),
    [appKey, venues],
  );

  useEffect(() => {
    if (!selectedVenueId) {
      return;
    }

    webViewRef.current?.injectJavaScript(
      `window.focusCinemaVenue?.(${JSON.stringify(selectedVenueId)}); true;`,
    );
  }, [selectedVenueId]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        venueId?: string;
      };

      if (message.type === "error") {
        setIsSdkError(true);
      }

      if (message.type === "select" && message.venueId) {
        onVenueSelect?.(message.venueId);
      }
    } catch {
      setIsSdkError(true);
    }
  }

  if (!appKey) {
    return (
      <View className="h-[360px] items-center justify-center bg-[#e8f0ec] px-6">
        <Text className="text-center text-sm text-[#193033]">
          카카오 지도 키가 설정되지 않았음
        </Text>
      </View>
    );
  }

  if (isSdkError) {
    return (
      <View className="h-[360px] items-center justify-center bg-[#e8f0ec] px-6">
        <Text className="text-center text-sm text-[#193033]">
          카카오 지도를 불러오지 못했음
        </Text>
      </View>
    );
  }

  return (
    <View className="h-[360px] overflow-hidden bg-[#e8f0ec]">
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={() => setIsSdkError(true)}
        scrollEnabled={false}
        automaticallyAdjustContentInsets={false}
        setSupportMultipleWindows={false}
      />
    </View>
  );
}
