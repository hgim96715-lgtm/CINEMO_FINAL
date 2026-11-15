import { Module } from "@nestjs/common";

import { NotificationsController } from "./controllers/notifications.controller";

import { PushTokenService } from "./services/push-token.service";
import { PushTokenRepository } from "./repositories/push-token.repository";
import { ExpoPushService } from "./services/expo-push.service";

@Module({
  controllers: [NotificationsController],
  providers: [PushTokenService, PushTokenRepository, ExpoPushService],
  exports: [PushTokenService, ExpoPushService],
})
export class NotificationsModule {}
