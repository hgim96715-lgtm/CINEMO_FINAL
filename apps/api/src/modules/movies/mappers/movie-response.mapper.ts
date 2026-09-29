import { Prisma } from "@prisma/client";

import { MovieResponseDto } from "../dto/responses/movie.response.dto";

const movieInclude = {
  titles: true,
  releases: true,
  media: true,
  providerLinks: true,
  watchOptions: true,
} satisfies Prisma.MovieInclude;

export type MovieWithDetails = Prisma.MovieGetPayload<{
  include: typeof movieInclude;
}>;

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toDateString(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function toMovieResponseDto(movie: MovieWithDetails): MovieResponseDto {
  return {
    id: movie.id,
    titles: movie.titles.map((title) => ({
      id: title.id,
      title: title.title,
      titleType: title.titleType,
      languageCode: title.languageCode,
      releaseId: title.releaseId,
    })),
    releases: movie.releases.map((release) => ({
      id: release.id,
      releaseDate: toDateString(release.releaseDate),
      releaseType: release.releaseType,
      status: release.status,
      countryCode: release.countryCode,
      isPrimary: release.isPrimary,
    })),

    providerLinks: movie.providerLinks.map((link) => ({
      sourceProvider: link.sourceProvider,
      externalId: link.externalId,
      matchMethod: link.matchMethod,
      matchStatus: link.matchStatus,
      confidence: link.confidence === null ? null : Number(link.confidence),
      verifiedAt: toIsoString(link.verifiedAt),
    })),

    media: movie.media.map((media) => ({
      mediaType: media.mediaType,
      sourceProvider: media.sourceProvider,
      url: media.url,
      externalId: media.externalId,
      isPrimary: media.isPrimary,
      status: media.status,
      verifiedAt: toIsoString(media.verifiedAt),
      releaseId: media.releaseId,
    })),
    watchOptions: movie.watchOptions.map((option) => ({
      watchProvider: option.watchProvider,
      availabilityType: option.availabilityType,
      regionCode: option.regionCode,
      url: option.url,
      expiresAt: toIsoString(option.expiresAt),
      lastVerifiedAt: toIsoString(option.lastVerifiedAt),
    })),

    createdAt: movie.createdAt.toISOString(),
    updatedAt: movie.updatedAt.toISOString(),
  };
}
