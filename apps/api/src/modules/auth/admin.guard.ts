import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import { PrismaService } from "@/prisma/prisma.service";

import type { SessionUser } from "./types/session-user.type";

type AuthenticatedRequest = Request & { user?: SessionUser };

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { isAdmin: true, status: true },
    });

    if (!user?.isAdmin || user.status !== "ACTIVE") {
      throw new ForbiddenException("관리자 권한이 필요합니다.");
    }

    return true;
  }
}
