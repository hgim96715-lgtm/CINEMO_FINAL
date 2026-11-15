import { Injectable, NotFoundException } from "@nestjs/common";

import { ResolvePostcardReportRequestDto } from "../dto/requests/resolve-postcard-report.request.dto";
import { PostcardReportsRepository } from "../repositories/postcard-reports.repository";

@Injectable()
export class PostcardReportsService {
  constructor(private readonly reports: PostcardReportsRepository) {}

  findOpen() {
    return this.reports.findOpen();
  }

  async resolve(
    reportId: string,
    moderatorId: string,
    input: ResolvePostcardReportRequestDto,
  ) {
    const result = await this.reports.resolve(
      reportId,
      moderatorId,
      input.action,
    );
    if (result === "not-found") {
      throw new NotFoundException("신고를 찾을 수 없습니다.");
    }

    return { resolved: true };
  }
}
