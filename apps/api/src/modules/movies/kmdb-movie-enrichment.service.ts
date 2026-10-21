import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { KmdbService } from "@/integrations/kmdb/kmdb.service";

import {
  cleanKmdbText,
  toSaveKmdbEnrichmentInput,
} from "./mappers/kmdb-movie-enrichment.mapper";
import { KmdbMovieEnrichmentRepository } from "./repositories/kmdb-movie-enrichment.repository";
import sharp from "sharp";

const normalizeTitle = (value?: string | null): string =>
  cleanKmdbText(value)
    ?.toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]/gu, "") ?? "";

@Injectable()
export class KmdbMovieEnrichmentService {
  constructor(
    private readonly repository: KmdbMovieEnrichmentRepository,
    private readonly kmdbService: KmdbService,
  ) {}

  async enrichMovieByMovieId(movieId: string): Promise<string> {
    const movie = await this.repository.findMovieForEnrichment(movieId);

    if (!movie) {
      throw new NotFoundException("영화를 찾을 수 없습니다.");
    }

    const title = movie.titles[0]?.title;

    if (!title) {
      throw new NotFoundException("영화 대표 제목을 찾을 수 없습니다.");
    }

    const results = await this.kmdbService.searchMovieResults(title);
    const normalizedTitle = normalizeTitle(title);
    const titleMatchedResults = results.filter((result) =>
      [result.title, result.titleOrg, result.titleEng].some(
        (candidateTitle) => normalizeTitle(candidateTitle) === normalizedTitle,
      ),
    );

    const releaseYear = movie.releases[0]?.releaseDate?.getUTCFullYear();
    const yearMatchedResults = releaseYear
      ? titleMatchedResults.filter(
          (result) => result.prodYear === String(releaseYear),
        )
      : [];

    const candidates =
      yearMatchedResults.length > 0 ? yearMatchedResults : titleMatchedResults;

    if (candidates.length === 0) {
      throw new NotFoundException(
        `KMDb에서 '${title}'와 일치하는 영화를 찾을 수 없습니다.`,
      );
    }

    if (candidates.length > 1) {
      throw new ConflictException({
        code: "KMDB_MOVIE_MATCH_REVIEW_REQUIRED",
        message: "KMDb 후보가 여러 개라 수동 확인이 필요합니다.",
        candidates: candidates.map((candidate) => ({
          docId: candidate.DOCID,
          title: cleanKmdbText(candidate.title),
          productionYear: candidate.prodYear ?? null,
          kmdbUrl: candidate.kmdbUrl ?? null,
        })),
      });
    }

    return this.enrichMovie(movieId, candidates[0].DOCID);
  }

  async enrichMovie(movieId: string, docId: string): Promise<string> {
    const title = await this.repository.findMovieTitle(movieId);

    if (!title) {
      throw new NotFoundException("영화 제목을 찾을 수 없습니다.");
    }

    const kmdbMovie = await this.kmdbService.getMovieByDocId(
      docId,
      title.title,
    );

    if (!kmdbMovie) {
      throw new NotFoundException("KMDb 영화를 찾을 수 없습니다.");
    }

    const enrichment = toSaveKmdbEnrichmentInput(kmdbMovie);
    const posterUrl = await this.selectVerticalPosterUrl(enrichment.posterUrls);

    return this.repository.saveEnrichment(movieId, {
      ...enrichment,
      posterUrl,
    });
  }

  private async selectVerticalPosterUrl(
    posterUrls: string[],
  ): Promise<string | null> {
    for (const posterUrl of posterUrls) {
      const imageSize = await this.getRemoteImageSize(posterUrl);
      if (imageSize && imageSize.height > imageSize.width) {
        return posterUrl;
      }
    }
    return null;
  }

  private async getRemoteImageSize(
    url: string,
  ): Promise<{ width: number; height: number } | null> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        return null;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height) {
        return null;
      }
      return {
        width: metadata.width,
        height: metadata.height,
      };
    } catch {
      return null;
    }
  }
}
