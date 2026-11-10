import { Injectable } from "@nestjs/common";

import { CurationRepository } from "./curation.repository";
import { toCurationResponseDto } from "./curation.mapper";

@Injectable()
export class CurationService {
  constructor(private readonly curationRepository: CurationRepository) {}

  async findActive() {
    const curations = await this.curationRepository.findActive();

    // 운영자가 큐레이션에 담은 영화는 메타데이터가 덜 채워져 있어도
    // 목록에서 제외하지 않는다. 누락된 포스터는 클라이언트의 기본 이미지가
    // 대신 표시하며, 선택한 작품 자체는 항상 노출한다.
    return curations.map(toCurationResponseDto);
  }
}
