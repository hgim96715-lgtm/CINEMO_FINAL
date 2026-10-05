import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { HealthService } from "./health.service";
import { Public } from "@/modules/auth/decorators/public.decorator";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: "API 상태 확인",
    description: "NestJS API와 데이터베이스 연결 상태 확인",
  })
  @ApiOkResponse({
    description: "API 정상 응답",
    schema: {
      example: {
        status: "ok",
        timestamp: "2026-09-29T12:00:00.000Z",
      },
    },
  })
  @Public()
  check() {
    return this.healthService.check();
  }
}
