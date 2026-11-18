import { Injectable } from "@nestjs/common";
import {
  MediaStatus,
  MediaType,
  MovieQuizRoundStatus,
  MovieQuizSource,
  MovieQuizStatus,
  Prisma,
} from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

const quizSelect = {
  id: true,
  prompt: true,
  source: true,
  movie: {
    select: {
      id: true,
      overview: true,
      titles: { select: { title: true, titleType: true } },
      media: {
        where: { mediaType: MediaType.POSTER, status: MediaStatus.ACTIVE },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
        take: 1,
        select: { url: true },
      },
    },
  },
} satisfies Prisma.MovieQuizSelect;

const roundSelect = {
  id: true,
  choices: true,
  attempts: true,
  status: true,
  scoreAwarded: true,
  quiz: { select: quizSelect },
} satisfies Prisma.MovieQuizRoundSelect;

export type MovieQuizRoundRecord = Prisma.MovieQuizRoundGetPayload<{
  select: typeof roundSelect;
}>;

@Injectable()
export class MovieQuizRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveRound(userId: string): Promise<MovieQuizRoundRecord | null> {
    return this.prisma.movieQuizRound.findFirst({
      where: { userId, status: MovieQuizRoundStatus.ACTIVE },
      orderBy: { startedAt: "desc" },
      select: roundSelect,
    });
  }

  findTodayFailedRound(userId: string, dayStart: Date): Promise<MovieQuizRoundRecord | null> {
    return this.prisma.movieQuizRound.findFirst({
      where: {
        userId,
        status: MovieQuizRoundStatus.FAILED,
        completedAt: { gte: dayStart },
      },
      orderBy: { completedAt: "desc" },
      select: roundSelect,
    });
  }

  findPublishedQuizCandidates() {
    return this.prisma.movieQuiz.findMany({
      where: { status: MovieQuizStatus.PUBLISHED },
      take: 100,
      orderBy: { updatedAt: "desc" },
      select: quizSelect,
    });
  }

  findQuizCandidateMovie() {
    return this.prisma.movie.findMany({
      where: {
        visibility: "PUBLIC",
        overview: { not: null },
        titles: { some: { titleType: "PRIMARY" } },
      },
      take: 100,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        overview: true,
        titles: { select: { title: true, titleType: true } },
      },
    });
  }

  createCinemoQuiz(input: { movieId: string; prompt: string }) {
    return this.prisma.movieQuiz.create({
      data: {
        movieId: input.movieId,
        prompt: input.prompt,
        source: MovieQuizSource.CINEMO,
        status: MovieQuizStatus.PUBLISHED,
      },
      select: quizSelect,
    });
  }

  createRound(input: {
    userId: string;
    quizId: string;
    choices: string[];
  }): Promise<MovieQuizRoundRecord> {
    return this.prisma.movieQuizRound.create({
      data: input,
      select: roundSelect,
    });
  }

  updateRoundChoices(roundId: string, choices: string[]): Promise<MovieQuizRoundRecord> {
    return this.prisma.movieQuizRound.update({
      where: { id: roundId },
      data: { choices },
      select: roundSelect,
    });
  }

  findRoundById(userId: string, roundId: string): Promise<MovieQuizRoundRecord | null> {
    return this.prisma.movieQuizRound.findFirst({
      where: { id: roundId, userId },
      select: roundSelect,
    });
  }

  updateRound(input: {
    roundId: string;
    attempts: number;
    status: MovieQuizRoundStatus;
    scoreAwarded?: number;
    completedAt?: Date | null;
  }): Promise<MovieQuizRoundRecord> {
    return this.prisma.movieQuizRound.update({
      where: { id: input.roundId },
      data: {
        attempts: input.attempts,
        status: input.status,
        scoreAwarded: input.scoreAwarded,
        completedAt: input.completedAt,
      },
      select: roundSelect,
    });
  }

  findPublicMovie(movieId: string) {
    return this.prisma.movie.findFirst({
      where: { id: movieId, visibility: "PUBLIC" },
      select: { id: true },
    });
  }

  findChoiceTitles(excludedMovieId: string) {
    return this.prisma.movieTitle.findMany({
      where: {
        movieId: { not: excludedMovieId },
        titleType: "PRIMARY",
        movie: { visibility: "PUBLIC" },
      },
      take: 100,
      orderBy: { updatedAt: "desc" },
      select: { title: true },
    });
  }

  createUserQuiz(input: { userId: string; movieId: string; prompt: string }) {
    return this.prisma.movieQuiz.create({
      data: {
        authorId: input.userId,
        movieId: input.movieId,
        prompt: input.prompt,
        source: MovieQuizSource.USER,
        status: MovieQuizStatus.PENDING,
      },
      select: { id: true, status: true, createdAt: true },
    });
  }

  async findWeeklyLeaderboard(weekStart: Date) {
    const scores = await this.prisma.movieQuizRound.groupBy({
      by: ["userId"],
      where: {
        status: MovieQuizRoundStatus.CORRECT,
        completedAt: { gte: weekStart },
      },
      _sum: { scoreAwarded: true },
      _count: { _all: true },
      orderBy: [{ _sum: { scoreAwarded: "desc" } }, { _count: { userId: "desc" } }],
      take: 20,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: scores.map((score) => score.userId) } },
      select: { id: true, nickname: true, profileImageUrl: true },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    return scores.flatMap((score, index) => {
      const user = usersById.get(score.userId);
      if (!user) return [];
      return [{
        rank: index + 1,
        nickname: user.nickname,
        profileImageUrl: user.profileImageUrl,
        score: score._sum.scoreAwarded ?? 0,
        correctCount: score._count._all,
      }];
    });
  }
}
