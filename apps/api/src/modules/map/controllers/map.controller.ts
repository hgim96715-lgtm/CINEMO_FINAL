import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { Public } from "@/modules/auth/decorators/public.decorator";
import { SearchKakaoPlacesRequestDto } from "@/integrations/kakao/requests/search-kakao-places.request.dto";
import { MapService } from "../services/map.service";
import { SaveVenueRequestDto } from "../dto/requests/save-cinema-venue.request.dto";
import { Venue } from "@prisma/client";
import { GetCinemaVenuesRequestDto } from "../dto/requests/get-cinema-venues.request.dto";
import { ImportCinemaVenuesRequestDto } from "../dto/requests/import-cinema-venues.request.dto";
import { CinemaVenueResponseDto } from "../dto/responses/cinema-venue.response.dto";
import { CinemaVenueImportService } from "../services/cinema-venue-import.service";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";
import { UpsertCinemaChainVenueRequestDto } from "../dto/requests/upsert-cinema-chain-venue.request.dto";

@ApiTags("MAP")
@Controller("map")
export class MapController {
  constructor(
    private readonly mapService: MapService,
    private readonly cinemaVenueImportService: CinemaVenueImportService,
  ) {}

  @Get("venues/search")
  @Public()
  @ApiOperation({ summary: "관람 장소 검색" })
  @ApiOkResponse({ description: "관람 장소 검색 결과" })
  searchPlaces(@Query() query: SearchKakaoPlacesRequestDto) {
    return this.mapService.searchPlaces(query.query, query.page, query.size);
  }

  @Get("venues")
  @Public()
  @ApiOperation({ summary: "지역별 영화관 조회" })
  @ApiOkResponse({
    type: [CinemaVenueResponseDto],
    description: "지역별 영화관 목록",
  })
  getCinemasByRegion(@Query() query: GetCinemaVenuesRequestDto) {
    return this.mapService.findCinemasByRegion(query);
  }

  @Post("venues/import")
  @ApiOperation({
    summary: "전국 영화관 수집 및 저장",
    description: "지역별 검색어로 카카오 영화관을 수집하고 Venue에 저장",
  })
  importCinemaVenues(@Body() body: ImportCinemaVenuesRequestDto) {
    return this.cinemaVenueImportService.collectAndSave(body.searchQueries);
  }

  @Post("venues")
  @ApiOperation({ summary: "관람 장소 저장" })
  @ApiCreatedResponse({ description: "관람 장소 저장 결과" })
  saveVenue(@Body() place: SaveVenueRequestDto): Promise<Venue> {
    return this.mapService.saveVenue(place);
  }

  @Put("venues/:venueId/chains")
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: "영화관 체인 코드 연결",
    description: "카카오 영화관 장소와 체인의 공식 상영시간표 극장 코드를 연결",
  })
  upsertCinemaChainVenue(
    @Param("venueId") venueId: string,
    @Body() body: UpsertCinemaChainVenueRequestDto,
  ) {
    return this.mapService.upsertCinemaChainVenue({
      venueId,
      chain: body.chain,
      externalCode: body.externalCode,
      officialName: body.officialName ?? null,
      bookingUrl: body.bookingUrl ?? null,
    });
  }
}
