import { Injectable } from "@nestjs/common";
import { CurationStatus } from "@prisma/client";

import { AdminRepository } from "./admin.repository";
import { CurationRepository } from "./curation.repository";
import { toCurationResponseDto } from "./curation.mapper";
import { CreateCurationRequestDto } from "./dto/requests/create-curation.request.dto";
import { UpdateCurationRequestDto } from "./dto/requests/update-curation.request.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly curationRepository: CurationRepository,
  ) {}

  findUsers() {
    return this.adminRepository.findUsers();
  }

  findUserActivity(userId: string) {
    return this.adminRepository.findUserActivity(userId);
  }

  async findCurations() {
    const curations = await this.curationRepository.findAll();
    return curations.map(toCurationResponseDto);
  }

  async createCuration(input: CreateCurationRequestDto) {
    const curation = await this.curationRepository.create({
      ...input,
      eyebrow: input.eyebrow,
      description: input.description ?? null,
      status: input.status ?? CurationStatus.DRAFT,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      movies: input.movies,
    });

    return toCurationResponseDto(curation);
  }

  async updateCuration(id: string, input: UpdateCurationRequestDto) {
    const curation = await this.curationRepository.update(id, {
      ...input,
      startsAt:
        input.startsAt === undefined
          ? undefined
          : input.startsAt
            ? new Date(input.startsAt)
            : null,
      endsAt:
        input.endsAt === undefined
          ? undefined
          : input.endsAt
            ? new Date(input.endsAt)
            : null,
      movies: input.movies,
    });

    return toCurationResponseDto(curation);
  }

  deleteCuration(id: string) {
    return this.curationRepository.delete(id);
  }
}
