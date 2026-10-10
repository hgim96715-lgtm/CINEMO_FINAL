import {Body, Controller, Get, Post, Query,} from "@nestjs/common";
import {ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags,} from "@nestjs/swagger";

import {Public} from "@/modules/auth/decorators/public.decorator";
import {SearchKakaoPlacesRequestDto} from "@/integrations/kakao/requests/search-kakao-places.request.dto";
import {MapService} from "@/modules/map/map.service";
import {SaveVenueRequestDto} from "@/modules/map/requests/save-cinema-venue.request.dto";
import {Venue} from "@prisma/client";


@ApiTags("MAP")
@Controller("map")
export class MapController {
    constructor(private readonly mapService: MapService) {}

    @Get("venues/search")
    @Public()
    @ApiOperation({ summary: "관람 장소 검색" })
    @ApiOkResponse({ description: "관람 장소 검색 결과" })
    searchPlaces(
        @Query() query: SearchKakaoPlacesRequestDto,
    ) {
        return this.mapService.searchPlaces(
            query.query,
            query.page,
            query.size,
        );
    }

    @Post("venues")
    @ApiOperation({ summary: "관람 장소 저장" })
    @ApiCreatedResponse({ description: "관람 장소 저장 결과" })
    saveVenue(
        @Body() place: SaveVenueRequestDto,
    ):Promise<Venue> {
        return this.mapService.saveVenue(place);
    }
}
