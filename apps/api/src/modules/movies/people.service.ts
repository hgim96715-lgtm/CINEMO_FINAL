import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, SourceProvider } from "@prisma/client";

import { TmdbService } from "@/integrations/tmdb/tmdb.service";
import { PrismaService } from "@/prisma/prisma.service";

import { toTmdbPersonProfileUpdate } from "./mappers/tmdb-person.mapper";
import { TmdbMovieBatchImportService } from "./tmdb-movie-batch-import.service";
import {
  PeopleRepository,
  PersonWithDetails,
} from "./repositories/people.repository";
import { MoviePersonRepository } from "./repositories/movie-person.repository";

@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);

  constructor(
    private readonly peopleRepository: PeopleRepository,
    private readonly moviePersonRepository: MoviePersonRepository,
    private readonly tmdbService: TmdbService,
    private readonly tmdbMovieBatchImportService: TmdbMovieBatchImportService,
    private readonly prisma: PrismaService,
  ) {}

  async findById(personId: string): Promise<PersonWithDetails> {
    const person = await this.peopleRepository.findById(personId);

    if (!person) {
      throw new NotFoundException("인물을 찾을 수 없습니다.");
    }

    return person;
  }

  async enrichFromTmdb(personId: string, tmdbPersonId: number) {
    const tmdbPerson = await this.tmdbService.getPersonDetail(tmdbPersonId);

    const profileUpdate = toTmdbPersonProfileUpdate(tmdbPerson);

    const providerLink = await this.prisma.moviePersonProviderLink.findUnique({
      where: {
        sourceProvider_externalId: {
          sourceProvider: SourceProvider.TMDB,
          externalId: String(tmdbPersonId),
        },
      },
    });

    if (!providerLink) {
      throw new NotFoundException("TMDB 인물 연결 정보를 찾을 수 없습니다.");
    }

    if (providerLink.personId !== personId) {
      throw new ConflictException(
        "TMDB 인물이 다른 CINEMO 인물과 연결되어 있습니다.",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.moviePersonRepository.updateProfile(
        tx,
        personId,
        profileUpdate,
      );
    });

    const tmdbCredits = await this.tmdbService.getPersonMovieCredits(
      tmdbPersonId,
    );
    const filmographyMovieIds = [
      ...tmdbCredits.crew,
      ...tmdbCredits.cast,
    ]
      .filter((movie) => !movie.adult && Boolean(movie.release_date))
      .sort((left, right) => {
        const leftDate = left.release_date || "0000-00-00";
        const rightDate = right.release_date || "0000-00-00";
        return rightDate.localeCompare(leftDate);
      })
      .map((movie) => movie.id)
      .filter((movieId, index, movieIds) => movieIds.indexOf(movieId) === index)
      .slice(0, 50);

    for (let index = 0; index < filmographyMovieIds.length; index += 3) {
      const batch = filmographyMovieIds.slice(index, index + 3);
      const results = await Promise.allSettled(
        batch.map((movieId) =>
          this.tmdbMovieBatchImportService.importMovie(movieId),
        ),
      );

      results.forEach((result, batchIndex) => {
        if (result.status === "rejected") {
          this.logger.warn(
            `인물 필모그래피 영화 보완 실패: person=${personId}, tmdbMovieId=${batch[batchIndex]}`,
          );
        }
      });
    }

    return this.findById(personId);
  }
}
