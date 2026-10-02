import { SourceProvider } from "@prisma/client";

import type { KobisDailyBoxOfficeItemResponseDto } from "@/integrations/kobis/dto/responses/kobis-daily-box-office.response.dto";

import type { SaveMovieRankingSnapshotInput } from "../movies.repository";

export function toKobisRankingSnapshotInput(
  movie: KobisDailyBoxOfficeItemResponseDto,
  movieId: string,
  collectedAt: Date,
): SaveMovieRankingSnapshotInput {
  const audienceCount = Number(movie.audiCnt);

  return {
    movieId,
    sourceProvider: SourceProvider.KOBIS,
    rank: Number(movie.rank),
    audienceCount: Number.isFinite(audienceCount) ? audienceCount : null,
    collectedAt,
  };
}
