import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/prisma/prisma.service";

export type ServiceVisitRow = {
  day: string;
  channel: string;
  visitors: number;
  guestVisitors: number;
  visits: number;
};

@Injectable()
export class ServiceVisitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  record(input: {
    id: string;
    day: string;
    channel: "web" | "app";
    visitorKey: string;
    authenticated: boolean;
  }) {
    return this.prisma.serviceVisit.createMany({
      data: input,
      skipDuplicates: true,
    });
  }

  summaryBetween(firstDay: string, lastDay: string) {
    return this.prisma.$queryRaw<ServiceVisitRow[]>`
      SELECT day, channel, COUNT(DISTINCT visitor_key)::int AS visitors,
        COUNT(DISTINCT visitor_key) FILTER (WHERE NOT authenticated)::int AS "guestVisitors",
        COUNT(*)::int AS visits
      FROM service_visits
      WHERE day >= ${firstDay} AND day <= ${lastDay}
      GROUP BY day, channel
    `;
  }
}
