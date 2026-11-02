import { PartialType } from "@nestjs/swagger";

import { CreateCurationRequestDto } from "./create-curation.request.dto";

export class UpdateCurationRequestDto extends PartialType(CreateCurationRequestDto) {}
