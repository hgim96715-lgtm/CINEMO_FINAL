import { Body, Controller, HttpCode, Post, Req } from "@nestjs/common";
import { IsIn, IsUUID } from "class-validator";
import type { Request } from "express";

import { OptionalAuth } from "@/modules/auth/decorators/optional-auth.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";
import { ServiceVisitsService } from "./service-visits.service";

class RecordServiceVisitDto {
  @IsIn(["web", "app"])
  channel!: "web" | "app";

  @IsUUID("4")
  visitorId!: string;

  @IsUUID("4")
  visitId!: string;
}

@Controller("visits")
export class ServiceVisitsController {
  constructor(private readonly visits: ServiceVisitsService) {}

  @OptionalAuth()
  @Post()
  @HttpCode(204)
  async record(@Body() input: RecordServiceVisitDto, @Req() request: Request & { user?: SessionUser }) {
    if (!request.user?.isAdmin) {
      await this.visits.record(input, Boolean(request.user));
    }
  }
}
