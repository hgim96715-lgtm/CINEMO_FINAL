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

export type ConversionSummary = ConversionCounts & {
  rates: ConversionRates;
};

export type ConversionMetric = {
  label: string;
  countKey: ConversionCountKey;
  rateKey: ConversionRateKey;
  base: string;
};
