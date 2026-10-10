import {Injectable} from "@nestjs/common";

import {PrismaService} from "@/prisma/prisma.service";
import {Prisma} from "@prisma/client";


export const bookmarkedPeopleArgs=Prisma.validator<Prisma.UserPersonBookmarkDefaultArgs>()({
  select:{
    id:true,
    createdAt:true,
    person:{
      select:{
        id:true,
        name:true,
        nameEn:true,
        profileUrl:true,
        credits:{
          select:{
            creditType:true,
          }
        }
      }
    }
  }
})

export type BookmarkedPersonWithRoles = Prisma.UserPersonBookmarkGetPayload<typeof bookmarkedPeopleArgs>

@Injectable()
export class UserPersonBookmarkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndPerson(userId: string, personId: string) {
    return this.prisma.userPersonBookmark.findUnique({
      where: {
        userId_personId: {
          userId,
          personId,
        },
      },
    });
  }

  async add(userId: string, personId: string) {
    return this.prisma.userPersonBookmark.upsert({
      where: {
        userId_personId: {
          userId,
          personId,
        },
      },
      create: {
        userId,
        personId,
      },
      update: {},
    });
  }
  async remove(userId: string, personId: string) {
    await this.prisma.userPersonBookmark.deleteMany({
      where: {
        userId,
        personId,
      },
    });
  }

  async findAllByUser(userId:string){
    return this.prisma.userPersonBookmark.findMany({
      where:{
        userId,
      },
      orderBy:{
        createdAt:'desc',
      },
      ...bookmarkedPeopleArgs
    })
  }
}
