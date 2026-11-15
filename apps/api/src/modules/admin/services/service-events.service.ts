import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

import { toServiceConversionSummary } from "../mappers/service-conversion.mapper";
import { ServiceEventsRepository } from "../repositories/service-events.repository";
import type { ServiceEventType } from "../domain/service-events.types";

const dayFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type ServiceEventInput = {
  channel: "web" | "app";
  visitorId: string;
  type: ServiceEventType;
};

@Injectable()
export class ServiceEventsService {
  constructor(private readonly serviceEventsRepository: ServiceEventsRepository) {}

  async record(input: ServiceEventInput, authenticated: boolean) {
    const day = dayFormatter.format(new Date());
    const visitorKey = createHash("sha256")
      .update(`${day}:${input.channel}:${input.visitorId}`)
      .digest("hex");
    const id = createHash("sha256")
      .update(`${visitorKey}:${input.type}`)
      .digest("hex");

    await this.serviceEventsRepository.record({
      id,
      day,
      channel: input.channel,
      type: input.type,
      visitorKey,
      authenticated,
    });
  }

  async summary() {
    const now = Date.now();
    const days = Array.from({ length: 7 }, (_, index) =>
      dayFormatter.format(new Date(now - index * 86_400_000)),
    );
    const rows = await this.serviceEventsRepository.summaryBetween(days[6], days[0]);

    return toServiceConversionSummary(days, rows);
  }
}
