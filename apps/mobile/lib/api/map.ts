import { apiClient } from "./apiClient";

export type MapPlace = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  place_url: string;
  distance: string;
  x: string;
  y: string;
};

export type MapSearchResponse = {
  documents: MapPlace[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
};

export type SearchMapPlacesParams = {
  query: string;
  page?: number;
  size?: number;
};

export type Venue = {
  id: string;
  type:
    | "CINEMA"
    | "HOME"
    | "MUSEUM"
    | "EXHIBITION_HALL"
    | "PERFORMANCE_HALL"
    | "OTHER";
  provider: "KAKAO" | null;
  externalId: string | null;
  name: string;
  brandName: string | null;
  roadAddress: string | null;
  jibunAddress: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  placeUrl: string | null;
};

export async function searchMapPlaces(
  params: SearchMapPlacesParams,
  signal?: AbortSignal,
): Promise<MapSearchResponse> {
  const response = await apiClient.get<MapSearchResponse>(
    "/map/venues/search",
    {
      params: {
        query: params.query,
        page: params.page ?? 1,
        size: params.size ?? 15,
      },
      signal,
    },
  );

  return response.data;
}

export async function saveVenue(place: MapPlace): Promise<Venue> {
  const response = await apiClient.post<Venue>("/map/venues", place);
  return response.data;
}

export type CinemaVenue = {
  id: string;
  name: string;
  brandName: string | null;
  region1Code: string | null;
  region1Name: string | null;
  region2Code: string | null;
  region2Name: string | null;
  region3Code: string | null;
  region3Name: string | null;
  roadAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  placeUrl: string | null;
};

export async function getCinemaVenues(
  signal?: AbortSignal,
): Promise<CinemaVenue[]> {
  const response = await apiClient.get<CinemaVenue[]>("/map/venues", {
    signal,
  });

  return response.data;
}
