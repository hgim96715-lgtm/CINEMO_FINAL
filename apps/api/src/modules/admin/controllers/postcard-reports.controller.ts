import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";

import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";

import { ResolvePostcardReportRequestDto } from "../dto/requests/resolve-postcard-report.request.dto";
import { AdminGuard } from "../guards/admin.guard";
import { PostcardReportsService } from "../services/postcard-reports.service";

@Controller("admin/postcard-reports")
@UseGuards(AdminGuard)
export class PostcardReportsController {
  constructor(private readonly reports: PostcardReportsService) {}

  @Get()
  list() {
    return this.reports.findOpen();
  }

  @Patch(":id")
  async resolve(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: ResolvePostcardReportRequestDto,
    @CurrentUser() moderator: SessionUser,
  ) {
    return this.reports.resolve(id, moderator.id, input);
  }
}
