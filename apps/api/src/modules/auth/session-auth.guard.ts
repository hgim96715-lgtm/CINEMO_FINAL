import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { AuthService } from "./auth.service";

import type { SessionUser } from "./types/session-user.type";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./decorators/public.decorator";
import { OPTIONAL_AUTH_KEY } from "./decorators/optional-auth.decorator";
import { SESSION_COOKIE_NAME } from "./session-cookie";

type AuthenticatedRequest = Request & {
  user: SessionUser;
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );
    const sessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (isOptionalAuth && !sessionToken) {
      return true;
    }

    request.user = await this.authService.validateSession(
      sessionToken,
    );
    return true;
  }
}
