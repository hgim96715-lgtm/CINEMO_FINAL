import { SourceProvider } from "@prisma/client";

import type { KobisDailyBoxOfficeItemResponseDto } from "@/integrations/kobis/dto/responses/kobis-daily-box-office.response.dto";

import type { SaveMovieRankingSnapshotInput } from "../movies.repository";

function parseKobisNumber(value?: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toKobisRankingSnapshotInput(
  movie: KobisDailyBoxOfficeItemResponseDto,
  movieId: string,
  collectedAt: Date,
): SaveMovieRankingSnapshotInput {
  return {
    movieId,
    sourceProvider: SourceProvider.KOBIS,
    rank: parseKobisNumber(movie.rank) ?? 0,
    rankChange: parseKobisNumber(movie.rankInten),
    audienceCount: parseKobisNumber(movie.audiCnt),
    totalAudienceCount: parseKobisNumber(movie.audiAcc),
    collectedAt,
  };
}
