import { Injectable, Logger } from "@nestjs/common";
import { KakaoService } from "@/integrations/kakao/kakao.service";
import type { KakaoPlaceDocument } from "@/integrations/kakao/types/kakao-local-response.type";
import { toVenueInput } from "./mappers/cinema-venue.mapper";
import {
  VenueRepository,
  type UpsertVenueInput,
  type UpsertManyCinemasResult,
} from "./repositories/cinema-venue.repository";
import { CINEMA_SEARCH_QUERIES } from "./constants/cinema-search-queries";

const PAGE_SIZE = 15;

@Injectable()
export class CinemaVenueImportService {
  private readonly logger = new Logger(CinemaVenueImportService.name);

  constructor(
    private readonly kakaoService: KakaoService,
    private readonly venueRepository: VenueRepository,
  ) {}

  async collectAndSave(
    searchQueries: readonly string[] = CINEMA_SEARCH_QUERIES,
  ): Promise<
    UpsertManyCinemasResult & {
      searchQueryCount: number;
      foundPlaceCount: number;
      skippedPlaceCount: number;
      deactivatedPlaceCount: number;
    }
  > {
    const checkedAt = new Date();
    const places = new Map<string, KakaoPlaceDocument>();

    for (const [index, query] of searchQueries.entries()) {
      this.logger.log(
        `[${index + 1}/${searchQueries.length}] ${query} 영화관 검색 시작`,
      );

      for (let page = 1; page <= 3; page += 1) {
        const response = await this.kakaoService.searchPlaces(
          `${query} 영화관`,
          page,
          PAGE_SIZE,
        );

        for (const place of response.documents) {
          if (!place.category_name.includes("영화관")) {
            continue;
          }

          places.set(place.id, place);
        }

        if (response.meta.is_end) {
          break;
        }
      }

      this.logger.log(
        `[${index + 1}/${searchQueries.length}] ${query} 완료 · 현재 ${places.size}개`,
      );
    }

    const placeList = [...places.values()];
    const inputs: UpsertVenueInput[] = [];
    let skippedPlaceCount = 0;

    for (const [index, place] of placeList.entries()) {
      try {
        const addressResponse = await this.kakaoService.searchAddress(
          place.road_address_name || place.address_name,
        );

        const address = addressResponse.documents[0];

        if (!address) {
          skippedPlaceCount += 1;
          continue;
        }

        inputs.push(
          toVenueInput({
            place,
            address,
          }),
        );
      } catch {
        skippedPlaceCount += 1;
      }

      if (
        (index + 1) % 50 === 0 ||
        index === placeList.length - 1
      ) {
        this.logger.log(
          `주소 보완 진행률: ${index + 1}/${placeList.length} · ` +
            `성공 ${inputs.length}개 · 건너뜀 ${skippedPlaceCount}개`,
        );
      }
    }

    const saved = await this.venueRepository.upsertManyCinemas(
      inputs,
      checkedAt,
    );

    const canDeactivateMissingCinemas =
      searchQueries.length > 0 &&
      places.size > 0 &&
      skippedPlaceCount === 0;

    const deactivated =
      canDeactivateMissingCinemas
        ? await this.venueRepository.deactivateCinemasNotSeenSince(checkedAt)
        : { count: 0 };

    this.logger.log(
      `영화관 수집 완료 · 검색 ${places.size}개 · ` +
        `저장 ${saved.total}개 · 신규 ${saved.created}개 · ` +
        `수정 ${saved.updated}개 · 비활성화 ${deactivated.count}개 · ` +
        `건너뜀 ${skippedPlaceCount}개`,
    );

    return {
      ...saved,
      searchQueryCount: searchQueries.length,
      foundPlaceCount: places.size,
      skippedPlaceCount,
      deactivatedPlaceCount: deactivated.count,
    };
  }
}
