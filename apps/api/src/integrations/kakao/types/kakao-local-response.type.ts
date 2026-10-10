export type KakaoPlaceDocument = {
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

export type KakaoAddressInfo = {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  region_3depth_h_name: string;
  h_code: string;
  b_code: string;
  mountain_yn: string;
  main_address_no: string;
  sub_address_no: string;
  x: string;
  y: string;
};

export type KakaoRoadAddressInfo = {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  road_name: string;
  underground_yn: string;
  main_building_no: string;
  sub_building_no: string;
  building_name: string;
  zone_no: string;
  x: string;
  y: string;
};

export type KakaoAddressDocument = {
  address_name: string;
  address_type: string;
  x: string;
  y: string;
  address: KakaoAddressInfo | null;
  road_address: KakaoRoadAddressInfo | null;
};

export type KakaoSearchMeta = {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
};

export type KakaoLocalSearchResponse = {
  documents: KakaoPlaceDocument[];
  meta: KakaoSearchMeta;
};

export type KakaoAddressSearchResponse = {
  documents: KakaoAddressDocument[];
  meta: KakaoSearchMeta;
};
