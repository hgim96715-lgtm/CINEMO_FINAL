import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { SessionUser } from "../types/session-user.type";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser => {
    const request = context.switchToHttp().getRequest<{ user: SessionUser }>();

    return request.user;
  },
);
