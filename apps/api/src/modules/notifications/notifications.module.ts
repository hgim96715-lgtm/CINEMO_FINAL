import { Module } from "@nestjs/common";

import { NotificationsController } from "./notifications.controller";

import { PushTokenService } from "./push-token.service";
import { PushTokenRepository } from "@/modules/notifications/push-token.repository";
import { ExpoPushService } from "@/modules/notifications/expo-push.service";

@Module({
  controllers: [NotificationsController],
  providers: [PushTokenService, PushTokenRepository, ExpoPushService],
  exports: [PushTokenService, ExpoPushService],
})
export class NotificationsModule {}
