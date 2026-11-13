import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

import { toServiceVisitSummary } from "./mappers/service-visit.mapper";
import { ServiceVisitsRepository } from "./service-visits.repository";

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
  constructor(private readonly serviceVisitsRepository: ServiceVisitsRepository) {}

  async record(input: VisitInput, authenticated: boolean) {
    const day = dayFormatter.format(new Date());
    const visitorKey = createHash("sha256")
      .update(`${day}:${input.channel}:${input.visitorId}`)
      .digest("hex");
    const id = createHash("sha256")
      .update(`${visitorKey}:${input.visitId}`)
      .digest("hex");

    await this.serviceVisitsRepository.record({
      id,
      day,
      channel: input.channel,
      visitorKey,
      authenticated,
    });
  }

  async summary() {
    const now = Date.now();
    const days = Array.from({ length: 7 }, (_, index) =>
      dayFormatter.format(new Date(now - index * 86_400_000)),
    );
    const rows = await this.serviceVisitsRepository.summaryBetween(days[6], days[0]);
    return toServiceVisitSummary(days, rows);
  }
}
