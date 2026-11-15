import type { ServiceConversionRow } from "../repositories/service-events.repository";

const channels = ["web", "app"] as const;

function percentage(value: number, base: number) {
  return base > 0 ? Math.round((value / base) * 1_000) / 10 : null;
}

export function toServiceConversionSummary(
  days: string[],
  rows: ServiceConversionRow[],
) {
  return days.map((day) => ({
    day,
    channels: channels.map((channel) => {
      const row = rows.find((candidate) =>
        candidate.day === day && candidate.channel === channel,
      );
      const visitors = row?.visitors ?? 0;
      const movieDetailOpens = row?.movieDetailOpens ?? 0;
      const recordIntents = row?.recordIntents ?? 0;
      const loginIntents = row?.loginIntents ?? 0;
      const postcardShareIntents = row?.postcardShareIntents ?? 0;
      const appStoreOpens = row?.appStoreOpens ?? 0;
      const cinemaSearchIntents = row?.cinemaSearchIntents ?? 0;

      return {
        channel,
        visitors,
        movieDetailOpens,
        recordIntents,
        loginIntents,
        postcardShareIntents,
        appStoreOpens,
        cinemaSearchIntents,
        rates: {
          movieDetailOpen: percentage(movieDetailOpens, visitors),
          recordIntent: percentage(recordIntents, movieDetailOpens),
          loginIntent: percentage(loginIntents, recordIntents),
          postcardShareIntent: percentage(postcardShareIntents, visitors),
          appStoreOpen: percentage(appStoreOpens, visitors),
          cinemaSearchIntent: percentage(cinemaSearchIntents, visitors),
        },
      };
    }),
  }));
}
