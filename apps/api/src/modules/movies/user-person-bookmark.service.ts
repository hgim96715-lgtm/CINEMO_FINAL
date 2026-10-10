import { Injectable, NotFoundException } from "@nestjs/common";

import { PeopleRepository } from "./repositories/people.repository";
import { UserPersonBookmarkRepository } from "./repositories/user-person-bookmark.repository";

@Injectable()
export class UserPersonBookmarkService {
  constructor(
    private readonly bookmarkRepository: UserPersonBookmarkRepository,
    private readonly peopleRepository: PeopleRepository,
  ) {}

  private async assertPersonExists(personId: string) {
    const person = await this.peopleRepository.findById(personId);

    if (!person) {
      throw new NotFoundException("인물을 찾을 수 없습니다.");
    }
  }

  async add(userId: string, personId: string) {
    await this.assertPersonExists(personId);
    await this.bookmarkRepository.add(userId, personId);
    return {
      personId,
      bookmarked: true,
    };
  }
  async remove(userId: string, personId: string) {
    await this.assertPersonExists(personId);

    await this.bookmarkRepository.remove(userId, personId);

    return {
      personId,
      bookmarked: false,
    };
  }

  async findStatus(userId: string, personId: string) {
    await this.assertPersonExists(personId);

    const bookmark = await this.bookmarkRepository.findByUserAndPerson(
      userId,
      personId,
    );

    return {
      personId,
      bookmarked: Boolean(bookmark),
    };
  }

  async findAllByUser(userId: string) {
    return this.bookmarkRepository.findAllByUser(userId);
  }
}
