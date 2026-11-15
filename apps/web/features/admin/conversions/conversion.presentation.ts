import type { ConversionMetric } from "./conversion.types";

export const conversionMetrics: readonly ConversionMetric[] = [
  { label: "영화 상세 진입", countKey: "movieDetailOpens", rateKey: "movieDetailOpen", base: "방문자 대비" },
  { label: "기록 시작", countKey: "recordIntents", rateKey: "recordIntent", base: "상세 진입 대비" },
  { label: "로그인 이동", countKey: "loginIntents", rateKey: "loginIntent", base: "기록 시작 대비" },
  { label: "엽서 공유 시도", countKey: "postcardShareIntents", rateKey: "postcardShareIntent", base: "방문자 대비" },
  { label: "영화관 찾기", countKey: "cinemaSearchIntents", rateKey: "cinemaSearchIntent", base: "방문자 대비" },
  { label: "App Store 이동", countKey: "appStoreOpens", rateKey: "appStoreOpen", base: "방문자 대비" },
];

const numberFormatter = new Intl.NumberFormat("ko-KR");

export function formatConversionNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatConversionRate(value: number | null) {
  return value === null ? "-" : `${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
}
