import { IsIn, IsUUID } from "class-validator";

import { serviceEventTypes, type ServiceEventType } from "../../domain/service-events.types";

export class RecordServiceEventRequestDto {
  @IsIn(["web", "app"])
  channel!: "web" | "app";

  @IsUUID("4")
  visitorId!: string;

  @IsIn(serviceEventTypes)
  type!: ServiceEventType;
}
