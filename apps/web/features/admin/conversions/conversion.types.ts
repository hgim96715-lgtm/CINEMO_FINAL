export type ConversionChannel = "web" | "app";

export type ConversionCountKey =
  | "movieDetailOpens"
  | "recordIntents"
  | "loginIntents"
  | "postcardShareIntents"
  | "appStoreOpens"
  | "cinemaSearchIntents";

export type ConversionRateKey =
  | "movieDetailOpen"
  | "recordIntent"
  | "loginIntent"
  | "postcardShareIntent"
  | "appStoreOpen"
  | "cinemaSearchIntent";

export type ConversionRates = Record<ConversionRateKey, number | null>;

export type ConversionCounts = {
  visitors: number;
} & Record<ConversionCountKey, number>;

export type ConversionRow = ConversionCounts & {
  day: string;
  channel: ConversionChannel;
  rates: ConversionRates;
};

/** API가 날짜별로 묶어 반환하는 전환 현황 원본 형태 */
export type ConversionDayResponse = {
  day: string;
  channels: ConversionRow[];
};

export type ConversionSummary = ConversionCounts & {
  rates: ConversionRates;
};

export type ConversionMetric = {
  label: string;
  countKey: ConversionCountKey;
  rateKey: ConversionRateKey;
  base: string;
};
