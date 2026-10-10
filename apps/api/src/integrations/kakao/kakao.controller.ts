import {Controller, Get, Query} from "@nestjs/common";
import {ApiOkResponse, ApiOperation, ApiQuery, ApiTags} from "@nestjs/swagger";

import {Public} from "@/modules/auth/decorators/public.decorator";
import {KakaoService} from "./kakao.service";
import {SearchKakaoPlacesRequestDto} from "@/integrations/kakao/requests/search-kakao-places.request.dto";
import {SearchKakaoAddressRequestDto} from "@/integrations/kakao/requests/search-kakao-address.request.dto";
import {KakaoAddressSearchResponseDto} from "@/integrations/kakao/responses/kakao-address-search.response.dto";


@ApiTags("KAKAO")
@Controller("kakao")
export class KakaoController {
    constructor(private readonly kakaoService: KakaoService) {}

    @Get("places/search")
    @Public()
    @ApiOperation({ summary: "Kakao 관람 장소 검색" })
    @ApiQuery({
        name: "query",
        required: true,
        example: "강남 영화관",
    })
    searchPlaces(@Query() query:SearchKakaoPlacesRequestDto) {
        return this.kakaoService.searchPlaces(query.query,query.page,query.size);
    }

    @Get("addresses/search")
    @Public()
    @ApiOperation({ summary: "Kakao 주소 검색" })
    @ApiOkResponse({
        type: KakaoAddressSearchResponseDto,
    })
    searchAddress(@Query() query: SearchKakaoAddressRequestDto) {
        return this.kakaoService.searchAddress(
            query.query,
            query.page,
            query.size,
        );
    }
}
