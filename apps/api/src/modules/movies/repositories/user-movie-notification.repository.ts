import {Injectable} from "@nestjs/common";
import {MovieNotificationType, ReleaseStatus} from "@prisma/client";

import {PrismaService} from "@/prisma/prisma.service";

@Injectable()
export class UserMovieNotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMovie(movieId: string) {
    return this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true },
    });
  }

  findUpcomingRelease(movieId: string) {
    return this.prisma.movieRelease.findFirst({
      where: {
        movieId,
        status: {
          in: [ReleaseStatus.ANNOUNCED, ReleaseStatus.SCHEDULED],
        },
        releaseDate: {
          gt: new Date(),
        },
        OR: [{ countryCode: "KR" }, { countryCode: null, isPrimary: true }],
      },
      orderBy: [{ isPrimary: "desc" }, { releaseDate: "asc" }],
    });
  }

  findByUserAndMovie(userId: string, movieId: string) {
    return this.prisma.userMovieNotification.findUnique({
      where: {
        userId_movieId_notificationType: {
          userId,
          movieId,
          notificationType: MovieNotificationType.RELEASE,
        },
      },
      include: {
        release: true,
      },
    });
  }

  async enable(userId: string, movieId: string, releaseId: string | null) {
    return this.prisma.userMovieNotification.upsert({
      where: {
        userId_movieId_notificationType: {
          userId,
          movieId,
          notificationType: MovieNotificationType.RELEASE,
        },
      },
      create: {
        userId,
        movieId,
        releaseId,
        notificationType: MovieNotificationType.RELEASE,
        enabled: true,
      },
      update: {
        releaseId,
        enabled: true,
        notifiedAt: null,
      },
    });
  }

  async disable(userId: string, movieId: string) {
    return this.prisma.userMovieNotification.update({
      where: {
        userId_movieId_notificationType: {
          userId,
          movieId,
          notificationType: MovieNotificationType.RELEASE,
        },
      },
      data: {
        enabled: false,
      },
    });
  }
  
  findDueReleaseNotifications(now = new Date()) {
    return this.prisma.userMovieNotification.findMany({
      where: {
        notificationType: MovieNotificationType.RELEASE,
        enabled: true,
        notifiedAt: null,
        user: {
          email: {
            not: null
          }
        },
        release: {
          is: {
            releaseDate: {
              lte: now,
            },
            status: {
              not: ReleaseStatus.CANCELLED
            }
          }
        },
      },
        select:{
          id:true,
          user:{
            select:{
              email:true,
            }
          },
          movie:{
            select:{
              id:true,
              titles:{
                where:{
                  titleType:'PRIMARY',
                },
                orderBy:{
                  createdAt:'asc'
                },
                take:1,
                select:{
                  title:true
                },
              },
            },
          },
          release:{
            select:{
              releaseDate:true
            }
          }
        }
    })
  }
  async marksNotified(notificationId:string){
    return this.prisma.userMovieNotification.update({
      where:{
        id:notificationId,
      },
      data:{
        notifiedAt:new Date(),
      }
    })
  }
  
  findEnabledReleasNotifications(userId:string){
    return this.prisma.userMovieNotification.findMany({
      where: {
        userId,
        notificationType: MovieNotificationType.RELEASE,
        enabled: true,
      },
      orderBy: {
        release:{
          releaseDate:'asc'
        }
      },
      select:{
        id:true,
        movieId:true,
        release:{
          select:{
            releaseDate:true,
          }
        },
        movie:{
          select:{
            titles:{
              where:{
                titleType:'PRIMARY',
              },
              orderBy:{
                createdAt:'asc'
              },
              take:1,
              select:{
                title:true
              }
            },
            media:{
              where:{
                mediaType:'POSTER',
                isPrimary:true,
                status:'ACTIVE'
              },
              take:1,
              select:{
                url:true
              }
            }
          }
        }
      }
    })
  }
}
