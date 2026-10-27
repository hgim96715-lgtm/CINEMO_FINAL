import { MapProvider, VenueType } from "@prisma/client";

import type {
  KakaoAddressDocument,
  KakaoPlaceDocument,
} from "@/integrations/kakao/types/kakao-local-response.type";
import { UpsertVenueInput } from "@/modules/map/repositories/cinema-venue.repository";

type VenueMapperInput = {
  place: KakaoPlaceDocument;
  address: KakaoAddressDocument;
};

const firstValue = (
  ...values: Array<string | null | undefined>
): string | null => values.find((value) => value?.trim())?.trim() ?? null;

const getVenueType = (categoryParts: string[]): VenueType => {
  const categoryPath = categoryParts.join(" ");

  switch (true) {
    case categoryPath.includes("영화관"):
      return VenueType.CINEMA;

    case categoryPath.includes("미술관") || categoryPath.includes("박물관"):
      return VenueType.MUSEUM;

    case categoryPath.includes("전시"):
      return VenueType.EXHIBITION_HALL;

    case categoryPath.includes("공연"):
      return VenueType.PERFORMANCE_HALL;

    default:
      return VenueType.OTHER;
  }
};

export function toVenueInput({
  place,
  address,
}: VenueMapperInput): UpsertVenueInput {
  const addressInfo = address.address;
  const roadAddress = address.road_address;

  const bCode = addressInfo?.b_code ?? null;
  if (!bCode) {
    throw new Error("주소 검색 결과에 법정동 코드가 없습니다.");
  }

  const categoryParts = place.category_name
    .split(">")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const longitude = firstValue(
    roadAddress?.x,
    addressInfo?.x,
    address.x,
    place.x,
  );

  const latitude = firstValue(
    roadAddress?.y,
    addressInfo?.y,
    address.y,
    place.y,
  );

  if (!longitude || !latitude) {
    throw new Error("장소 좌표가 없습니다.");
  }
  return {
    type: getVenueType(categoryParts),
    provider: MapProvider.KAKAO,
    externalId: place.id,
    name: place.place_name,
    brandName: categoryParts.at(-1) ?? null,

    region1Code: bCode.slice(0, 2),
    region1Name:
      roadAddress?.region_1depth_name ?? addressInfo?.region_1depth_name ?? "",
    region2Code: bCode.slice(0, 5),
    region2Name:
      roadAddress?.region_2depth_name ??
      addressInfo?.region_2depth_name ??
      null,
    region3Code: bCode,
    region3Name:
      roadAddress?.region_3depth_name ??
      addressInfo?.region_3depth_name ??
      null,

    hCode: addressInfo?.h_code ?? null,
    bCode,

    roadAddress: firstValue(roadAddress?.address_name, place.road_address_name),
    jibunAddress: firstValue(addressInfo?.address_name, place.address_name),
    latitude: latitude,
    longitude: longitude,
    phone: firstValue(place.phone),
    placeUrl: firstValue(place.place_url),
  };
}
