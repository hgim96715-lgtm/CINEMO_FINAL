import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/prisma/prisma.service";

import type { ServiceEventType } from "../domain/service-events.types";

export type ServiceConversionRow = {
  day: string;
  channel: string;
  visitors: number;
  movieDetailOpens: number;
  recordIntents: number;
  loginIntents: number;
  postcardShareIntents: number;
  appStoreOpens: number;
  cinemaSearchIntents: number;
};

@Injectable()
export class ServiceEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  record(input: {
    id: string;
    day: string;
    channel: "web" | "app";
    type: ServiceEventType;
    visitorKey: string;
    authenticated: boolean;
  }) {
    return this.prisma.serviceEvent.createMany({
      data: input,
      skipDuplicates: true,
    });
  }

  summaryBetween(firstDay: string, lastDay: string) {
    return this.prisma.$queryRaw<ServiceConversionRow[]>`
      WITH daily_visitors AS (
        SELECT day, channel, visitor_key
        FROM service_visits
        WHERE day >= ${firstDay} AND day <= ${lastDay}
        GROUP BY day, channel, visitor_key
      ),
      daily_events AS (
        SELECT
          day,
          channel,
          visitor_key,
          BOOL_OR(type = 'movie_detail_open') AS "movieDetailOpen",
          BOOL_OR(type = 'record_intent') AS "recordIntent",
          BOOL_OR(type = 'login_intent') AS "loginIntent",
          BOOL_OR(type = 'postcard_share_intent') AS "postcardShareIntent",
          BOOL_OR(type = 'app_store_open') AS "appStoreOpen",
          BOOL_OR(type = 'cinema_search_intent') AS "cinemaSearchIntent"
        FROM service_events
        WHERE day >= ${firstDay} AND day <= ${lastDay}
        GROUP BY day, channel, visitor_key
      )
      SELECT
        visitors.day,
        visitors.channel,
        COUNT(*)::int AS visitors,
        COUNT(*) FILTER (WHERE events."movieDetailOpen")::int AS "movieDetailOpens",
        COUNT(*) FILTER (WHERE events."recordIntent")::int AS "recordIntents",
        COUNT(*) FILTER (WHERE events."loginIntent")::int AS "loginIntents",
        COUNT(*) FILTER (WHERE events."postcardShareIntent")::int AS "postcardShareIntents",
        COUNT(*) FILTER (WHERE events."appStoreOpen")::int AS "appStoreOpens",
        COUNT(*) FILTER (WHERE events."cinemaSearchIntent")::int AS "cinemaSearchIntents"
      FROM daily_visitors visitors
      LEFT JOIN daily_events events
        ON events.day = visitors.day
        AND events.channel = visitors.channel
        AND events.visitor_key = visitors.visitor_key
      GROUP BY visitors.day, visitors.channel
    `;
  }
}
