import type {
  ConversionCounts,
  ConversionDayResponse,
  ConversionRow,
  ConversionSummary,
} from "./conversion.types";

const emptyCounts: ConversionCounts = {
  visitors: 0,
  movieDetailOpens: 0,
  recordIntents: 0,
  loginIntents: 0,
  postcardShareIntents: 0,
  appStoreOpens: 0,
  cinemaSearchIntents: 0,
};

function calculateRate(value: number, base: number) {
  return base > 0 ? Math.round((value / base) * 1_000) / 10 : null;
}

/**
 * 날짜별 API 응답을 화면이 쓰는 날짜·채널 단위 행으로 정규화함.
 * 화면은 이 뒤부터 API의 중첩 구조를 알 필요가 없음.
 */
export function toConversionRows(days: readonly ConversionDayResponse[]): ConversionRow[] {
  return days.flatMap(({ day, channels }) =>
    channels.map((channel) => ({
      ...channel,
      day,
    })),
  );
}

export function summarizeConversionRows(rows: readonly ConversionRow[]): ConversionSummary {
  const totals = rows.reduce<ConversionCounts>(
    (summary, row) => ({
      visitors: summary.visitors + row.visitors,
      movieDetailOpens: summary.movieDetailOpens + row.movieDetailOpens,
      recordIntents: summary.recordIntents + row.recordIntents,
      loginIntents: summary.loginIntents + row.loginIntents,
      postcardShareIntents: summary.postcardShareIntents + row.postcardShareIntents,
      appStoreOpens: summary.appStoreOpens + row.appStoreOpens,
      cinemaSearchIntents: summary.cinemaSearchIntents + row.cinemaSearchIntents,
    }),
    emptyCounts,
  );

  return {
    ...totals,
    rates: {
      movieDetailOpen: calculateRate(totals.movieDetailOpens, totals.visitors),
      recordIntent: calculateRate(totals.recordIntents, totals.movieDetailOpens),
      loginIntent: calculateRate(totals.loginIntents, totals.recordIntents),
      postcardShareIntent: calculateRate(totals.postcardShareIntents, totals.visitors),
      appStoreOpen: calculateRate(totals.appStoreOpens, totals.visitors),
      cinemaSearchIntent: calculateRate(totals.cinemaSearchIntents, totals.visitors),
    },
  };
}
