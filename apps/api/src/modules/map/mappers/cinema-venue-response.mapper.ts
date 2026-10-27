import { Prisma } from "@prisma/client";
import { CinemaVenueResponseDto } from "../dto/responses/cinema-venue.response.dto";

type CinemaVenueRecord = {
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
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  phone: string | null;
  placeUrl: string | null;
};

const toCoordinate = (value: Prisma.Decimal | null): number | null =>
  value === null ? null : value.toNumber();

export function toCinemaVenueResponseDto(
  venue: CinemaVenueRecord,
): CinemaVenueResponseDto {
  return {
    id: venue.id,
    name: venue.name,
    brandName: venue.brandName,
    region1Code: venue.region1Code,
    region1Name: venue.region1Name,
    region2Code: venue.region2Code,
    region2Name: venue.region2Name,
    region3Code: venue.region3Code,
    region3Name: venue.region3Name,
    roadAddress: venue.roadAddress,
    latitude: toCoordinate(venue.latitude),
    longitude: toCoordinate(venue.longitude),
    phone: venue.phone,
    placeUrl: venue.placeUrl,
  };
}
