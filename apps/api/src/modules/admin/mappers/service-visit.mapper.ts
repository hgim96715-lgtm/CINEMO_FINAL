import type { ServiceVisitRow } from "../service-visits.repository";

export function toServiceVisitSummary(days: string[], rows: ServiceVisitRow[]) {
  return days.map((day) => ({
    day,
    channels: (["web", "app"] as const).map((channel) => {
      const row = rows.find(
        (entry) => entry.day === day && entry.channel === channel,
      );
      return {
        channel,
        visitors: row?.visitors ?? 0,
        guestVisitors: row?.guestVisitors ?? 0,
        visits: row?.visits ?? 0,
      };
    }),
  }));
}
