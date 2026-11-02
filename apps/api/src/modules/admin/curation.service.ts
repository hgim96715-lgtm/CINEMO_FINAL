import { Injectable } from "@nestjs/common";

import { CurationRepository } from "./curation.repository";
import { toCurationResponseDto } from "./curation.mapper";

function hasKoreanTitle(
  titles: Array<{ title: string; languageCode: string | null }>,
) {
  return titles.some(
    (title) =>
      /[가-힣]/.test(title.title) ||
      title.languageCode?.toLowerCase().startsWith("ko") === true,
  );
}

@Injectable()
export class CurationService {
  constructor(private readonly curationRepository: CurationRepository) {}

  async findActive() {
    const curations = await this.curationRepository.findActive();

    return curations
      .map((curation) => ({
        ...curation,
        movies: curation.movies.filter(
          (item) =>
            item.movie.media.length > 0 && hasKoreanTitle(item.movie.titles),
        ),
      }))
      .filter((curation) => curation.movies.length > 0)
      .map(toCurationResponseDto);
  }
}
