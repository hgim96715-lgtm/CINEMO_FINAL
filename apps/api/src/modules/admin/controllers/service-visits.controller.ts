import { Body, Controller, HttpCode, Post, Req } from "@nestjs/common";
import type { Request } from "express";

import { OptionalAuth } from "@/modules/auth/decorators/optional-auth.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";

import { RecordServiceVisitRequestDto } from "../dto/requests/record-service-visit.request.dto";
import { ServiceVisitsService } from "../services/service-visits.service";

@Controller("visits")
export class ServiceVisitsController {
  constructor(private readonly visits: ServiceVisitsService) {}

  @OptionalAuth()
  @Post()
  @HttpCode(204)
  async record(
    @Body() input: RecordServiceVisitRequestDto,
    @Req() request: Request & { user?: SessionUser },
  ) {
    if (!request.user?.isAdmin) {
      await this.visits.record(input, Boolean(request.user));
    }
  }
}
