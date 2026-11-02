import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "@/modules/auth/decorators/public.decorator";

import { CurationService } from "./curation.service";
import { CurationResponseDto } from "./dto/responses/curation.response.dto";

@ApiTags("Curations")
@Controller("curations")
export class CurationController {
  constructor(private readonly curationService: CurationService) {}

  @Public()
  @Get("active")
  @ApiOperation({ summary: "현재 노출 중인 큐레이션 조회" })
  @ApiOkResponse({ type: CurationResponseDto, isArray: true })
  findActive() {
    return this.curationService.findActive();
  }
}
