import { Controller, Get, Param, Post } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { Public } from "../auth/decorators/public.decorator";

import { EnrichTmdbPersonRequestDto } from "./dto/requests/enrich-tmdb-person.request.dto";
import { PersonDetailResponseDto } from "./dto/responses/person-detail.response.dto";
import { toPersonDetailResponse } from "./mappers/people.mapper";
import { PeopleService } from "./people.service";
import { Throttle } from "node_modules/@nestjs/throttler/dist";

@ApiTags("People")
@Controller("people")
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Public()
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get(":personId")
  @Get(":personId")
  @ApiOperation({
    summary: "인물 상세 정보 조회",
    description: "감독·배우의 기본 정보와 필모그래피 조회",
  })
  @ApiOkResponse({
    description: "인물 상세 정보",
    type: PersonDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: "인물을 찾을 수 없음",
  })
  async findById(@Param("personId") personId: string) {
    const person = await this.peopleService.findById(personId);

    return toPersonDetailResponse(person);
  }

  @Public()
  @Post(":personId/enrich/tmdb/:tmdbPersonId")
  @ApiOperation({
    summary: "TMDB 인물 정보 보완",
    description:
      "TMDB 인물 정보에서 프로필 이미지·소개·출생일·출생지를 가져와 보완",
  })
  @ApiOkResponse({
    description: "보완된 인물 정보",
    type: PersonDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: "인물 또는 TMDB 연결 정보를 찾을 수 없음",
  })
  @ApiConflictResponse({
    description: "TMDB 인물이 다른 CINEMO 인물과 연결되어 있음",
  })
  async enrichFromTmdb(@Param() params: EnrichTmdbPersonRequestDto) {
    await this.peopleService.enrichFromTmdb(
      params.personId,
      params.tmdbPersonId,
    );

    const person = await this.peopleService.findById(params.personId);

    return toPersonDetailResponse(person);
  }
}
