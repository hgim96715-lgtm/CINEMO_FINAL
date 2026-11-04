export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

export function getPlatformLogoSrc(
  provider: string,
  logoPath: string | null | undefined,
): string | null {
  if (provider === "WATCHA") {
    return "/icons/platforms/watcha.svg";
  }

  return logoPath ? `${TMDB_IMAGE_BASE_URL}${logoPath}` : null;
}
