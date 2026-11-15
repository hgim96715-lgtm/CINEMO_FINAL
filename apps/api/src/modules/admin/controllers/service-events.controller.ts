import { Body, Controller, HttpCode, Post, Req } from "@nestjs/common";
import type { Request } from "express";

import { OptionalAuth } from "@/modules/auth/decorators/optional-auth.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";

import { RecordServiceEventRequestDto } from "../dto/requests/record-service-event.request.dto";
import { ServiceEventsService } from "../services/service-events.service";

@Controller("events")
export class ServiceEventsController {
  constructor(private readonly events: ServiceEventsService) {}

  @OptionalAuth()
  @Post()
  @HttpCode(204)
  async record(
    @Body() input: RecordServiceEventRequestDto,
    @Req() request: Request & { user?: SessionUser },
  ) {
    if (!request.user?.isAdmin) {
      await this.events.record(input, Boolean(request.user));
    }
  }
}
