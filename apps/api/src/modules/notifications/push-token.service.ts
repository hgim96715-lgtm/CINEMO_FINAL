import { Injectable } from "@nestjs/common";

import { RegisterPushTokenRequestDto } from "./dto/requests/register-push-token.request.dto";
import { PushTokenRepository } from "@/modules/notifications/push-token.repository";

@Injectable()
export class PushTokenService {
  constructor(private readonly pushTokenRepository: PushTokenRepository) {}

  register(userId: string, dto: RegisterPushTokenRequestDto) {
    return this.pushTokenRepository.register(userId, dto);
  }

  findTokensByUserId(userId: string) {
    return this.pushTokenRepository.findTokensByUserId(userId);
  }
}
