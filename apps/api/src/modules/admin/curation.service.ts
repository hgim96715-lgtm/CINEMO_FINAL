import { Injectable } from "@nestjs/common";

import { CurationRepository } from "./curation.repository";
import { toCurationResponseDto } from "./curation.mapper";

@Injectable()
export class CurationService {
  constructor(private readonly curationRepository: CurationRepository) {}

  async findActive() {
    const curations = await this.curationRepository.findActive();
    return curations.map(toCurationResponseDto);
  }
}
