import {apiClient} from "@/lib/api/apiClient";

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
    }
}

export type SearchMapPlacesParams = {
    query: string;
    page?: number;
    size?: number;
};

export type Venue = {
    id: string;
    type: "CINEMA" | "HOME" | "MUSEUM" | "EXHIBITION_HALL" | "PERFORMANCE_HALL" | "OTHER";
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

export async function searchMapPlaces(params: SearchMapPlacesParams,signal?:AbortSignal): Promise<MapSearchResponse> {
    const {data}=await  apiClient.get<MapSearchResponse>('/map/venues/search', {
        params:{
            query:params.query,
            page:params.page??1,
            size:params.size??15
        },
        signal,
    });
    return  data;
}

export async function saveVenue(place: MapPlace): Promise<Venue> {
    const {data}=await apiClient.post<Venue>('/map/venues', place);
    return data;
}
