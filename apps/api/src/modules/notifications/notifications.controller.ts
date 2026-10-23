import { Body, Controller, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";

import { RegisterPushTokenRequestDto } from "./dto/requests/register-push-token.request.dto";
import { PushTokenService } from "./push-token.service";
import { RegisterPushTokenResponseDto } from "@/modules/notifications/dto/responses/register-push-token.response.dto";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly pushTokenService: PushTokenService) {}

  @Post("push-token")
  @ApiOperation({
    summary: "모바일 푸시 토큰 등록",
    description: "로그인한 사용자의 기기에 발급된 Expo Push Token을 등록함.",
  })
  @ApiOkResponse({
    type: RegisterPushTokenResponseDto,
  })
  registerPushToken(
    @CurrentUser() user: SessionUser,
    @Body() dto: RegisterPushTokenRequestDto,
  ) {
    return this.pushTokenService.register(user.id, dto);
  }
}
