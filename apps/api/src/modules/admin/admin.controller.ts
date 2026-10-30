import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { AdminGuard } from "./admin.guard";
import { AdminService } from "./admin.service";

@ApiTags("Admin")
@ApiCookieAuth("cinemo_session")
@UseGuards(AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  @ApiOperation({ summary: "관리자용 회원·접속 현황 조회" })
  @ApiOkResponse({ description: "회원 목록과 접속 현황" })
  findUsers() {
    return this.adminService.findUsers();
  }

  @Get("users/:userId/activity")
  @ApiOperation({ summary: "관리자용 회원 활동 이력 조회" })
  @ApiOkResponse({ description: "최근 회원 활동 이력" })
  findUserActivity(@Param("userId", ParseUUIDPipe) userId: string) {
    return this.adminService.findUserActivity(userId);
  }
}
