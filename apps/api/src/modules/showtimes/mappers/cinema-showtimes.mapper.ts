const EARTH_RADIUS_KM = 6_371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function calculateDistanceKm(input: {
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
}) {
  const latitudeDelta = toRadians(input.toLatitude - input.fromLatitude);
  const longitudeDelta = toRadians(input.toLongitude - input.fromLongitude);
  const fromLatitude = toRadians(input.fromLatitude);
  const toLatitude = toRadians(input.toLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function getKoreaDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export const toCompactDate = (date: string) => date.replaceAll("-", "");
