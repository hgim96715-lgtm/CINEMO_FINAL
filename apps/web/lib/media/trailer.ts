type TrailerMedia = {
  sourceProvider: string;
  externalId: string | null;
};

export function getTrailerEmbedUrl(
  trailer: TrailerMedia | null | undefined,
): string | null {
  if (!trailer || trailer.sourceProvider !== "YOUTUBE" || !trailer.externalId) {
    return null;
  }

  return `https://www.youtube.com/embed/${trailer.externalId}?rel=0`;
}
