import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, SourceProvider } from "@prisma/client";

import { TmdbService } from "@/integrations/tmdb/tmdb.service";
import { PrismaService } from "@/prisma/prisma.service";

import { toTmdbPersonProfileUpdate } from "./mappers/tmdb-person.mapper";
import {
  PeopleRepository,
  PersonWithDetails,
} from "./repositories/people.repository";
import { MoviePersonRepository } from "./repositories/movie-person.repository";

@Injectable()
export class PeopleService {
  constructor(
    private readonly peopleRepository: PeopleRepository,
    private readonly moviePersonRepository: MoviePersonRepository,
    private readonly tmdbService: TmdbService,
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

    return this.prisma.$transaction(async (tx) => {
      const providerLink = await this.moviePersonRepository.findProviderLink(
        tx,
        SourceProvider.TMDB,
        String(tmdbPersonId),
      );

      if (!providerLink) {
        throw new NotFoundException("TMDB 인물 연결 정보를 찾을 수 없습니다.");
      }

      if (providerLink.personId !== personId) {
        throw new ConflictException(
          "TMDB 인물이 다른 CINEMO 인물과 연결되어 있습니다.",
        );
      }

      await this.moviePersonRepository.updateProfile(
        tx,
        personId,
        profileUpdate,
      );

      return this.moviePersonRepository.findByIdOrThrow(tx, personId);
    });
  }
}
