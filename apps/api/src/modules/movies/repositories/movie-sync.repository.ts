import {Injectable} from "@nestjs/common";
import {PrismaService} from "@/prisma/prisma.service";
import {MovieSyncJobType, MovieSyncStatus, Prisma} from "@prisma/client";

@Injectable()
export class MovieSyncRepository {
  constructor (private readonly prisma: PrismaService) {}
  
  createRun(jobType:MovieSyncJobType){
    return this.prisma.movieSyncRun.create({
      data:{
        jobType,
        status:MovieSyncStatus.PENDING,
      }
    })
  }
  findLatestUnfinishedRun(jobType: MovieSyncJobType) {
    return this.prisma.movieSyncRun.findFirst({
      where:{
        jobType,
        status:{
          in:[
              MovieSyncStatus.PENDING,
              MovieSyncStatus.RUNNING,
              MovieSyncStatus.PARTIAL
          ]
        }
      },
      orderBy:{
        startedAt:'desc'
      }
    });
  }
  markRunning(runId: string) {
    return this.prisma.movieSyncRun.update({
      where: {
        id: runId,
      },
      data: {
        status: MovieSyncStatus.RUNNING,
      },
    });
  }

  updateProgress(
    runId: string,
    input: {
      currentPage?: number;
      currentCursor?: string | null;
      processedCount?: number;
      successCount?: number;
      failureCount?: number;
    },
  ) {
    const data:Prisma.MovieSyncRunUpdateInput={
      status:MovieSyncStatus.RUNNING,...input
    };
    return this.prisma.movieSyncRun.update({
      where:{
        id:runId,
      },
      data,
    });
  }
  complete(runId:string){
    return this.prisma.movieSyncRun.update({
      where:{id:runId},
      data:{
        status:MovieSyncStatus.COMPLETED,
        completedAt:new Date()
      }
    });
  }
  fail(runId:string,errorMessage:string){
    return this.prisma.movieSyncRun.update({
      where:{id:runId},
      data:{
        status:MovieSyncStatus.FAILED,
        errorMessage,
        completedAt:new Date()
      }
    })
  }

  partial(runId: string, errorMessage: string) {
    return this.prisma.movieSyncRun.update({
      where: { id: runId },
      data: {
        status: MovieSyncStatus.PARTIAL,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }
}
