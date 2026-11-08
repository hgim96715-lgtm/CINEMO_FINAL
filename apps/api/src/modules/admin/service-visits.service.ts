import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

import { PrismaService } from "@/prisma/prisma.service";

const dayFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type VisitInput = {
  channel: "web" | "app";
  visitorId: string;
  visitId: string;
};

@Injectable()
export class ServiceVisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: VisitInput, authenticated: boolean) {
    const day = dayFormatter.format(new Date());
    const visitorKey = createHash("sha256")
      .update(`${day}:${input.channel}:${input.visitorId}`)
      .digest("hex");
    const id = createHash("sha256")
      .update(`${visitorKey}:${input.visitId}`)
      .digest("hex");

    await this.prisma.serviceVisit.createMany({
      data: { id, day, channel: input.channel, visitorKey, authenticated },
      skipDuplicates: true,
    });
  }

  async summary() {
    const now = Date.now();
    const days = Array.from({ length: 7 }, (_, index) =>
      dayFormatter.format(new Date(now - index * 86_400_000)),
    );
    const rows = await this.prisma.$queryRaw<{
      day: string;
      channel: string;
      visitors: number;
      guestVisitors: number;
      visits: number;
    }[]>`
      SELECT day, channel, COUNT(DISTINCT visitor_key)::int AS visitors,
        COUNT(DISTINCT visitor_key) FILTER (WHERE NOT authenticated)::int AS "guestVisitors",
        COUNT(*)::int AS visits
      FROM service_visits
      WHERE day >= ${days[6]} AND day <= ${days[0]}
      GROUP BY day, channel
    `;

    return days.map((day) => ({
      day,
      channels: (["web", "app"] as const).map((channel) => {
        const row = rows.find((entry) => entry.day === day && entry.channel === channel);
        return {
          channel,
          visitors: row?.visitors ?? 0,
          guestVisitors: row?.guestVisitors ?? 0,
          visits: row?.visits ?? 0,
        };
      }),
    }));
  }
}
