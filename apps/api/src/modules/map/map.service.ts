import {Injectable, NotFoundException} from "@nestjs/common";
import type {KakaoPlaceDocument,} from "@/integrations/kakao/types/kakao-local-response.type";
import {KakaoService} from "@/integrations/kakao/kakao.service";
import {toVenueInput} from "./mappers/cinema-venue.mapper";
import {VenueRepository} from "./repositories/cinema-venue.repository";
import type {Venue} from "@prisma/client";

@Injectable()
export class MapService {
    constructor(
        private readonly kakaoService: KakaoService,
        private readonly venueRepository: VenueRepository,
    ) {}

    searchPlaces(
        query: string,
        page = 1,
        size = 15,
    ) {
        return this.kakaoService.searchPlaces(query, page, size);
    }

    async saveVenue(place: KakaoPlaceDocument):Promise<Venue> {
        const addressResponse = await this.kakaoService.searchAddress(
            place.road_address_name || place.address_name,
        );

        const address = addressResponse.documents[0];

        if (!address) {
            throw new NotFoundException("장소 주소 정보를 찾을 수 없음");
        }

        return this.venueRepository.upsert(
            toVenueInput({
                place,
                address,
            }),
        );
    }
}
