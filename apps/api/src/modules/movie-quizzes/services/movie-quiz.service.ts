import { Injectable, NotFoundException } from "@nestjs/common";
import { MovieQuizRoundStatus } from "@prisma/client";

import { AnswerMovieQuizRequestDto } from "../dto/requests/answer-movie-quiz.request.dto";
import { CreateMovieQuizRequestDto } from "../dto/requests/create-movie-quiz.request.dto";
import {
  MovieQuizLeaderboardEntryResponseDto,
  MovieQuizRoundResponseDto,
} from "../dto/responses/movie-quiz.response.dto";
import {
  createCinemoQuizPrompt,
  getKoreaDayStart,
  getWeekStart,
  MAX_QUIZ_ATTEMPTS,
  normalizeQuizAnswer,
  toMovieQuizRoundResponse,
} from "../mappers/movie-quiz.mapper";
import { MovieQuizRepository } from "../repositories/movie-quiz.repository";

@Injectable()
export class MovieQuizService {
  constructor(private readonly movieQuizRepository: MovieQuizRepository) {}

  async startNextRound(userId: string): Promise<MovieQuizRoundResponseDto> {
    const activeRound = await this.movieQuizRepository.findActiveRound(userId);
    if (activeRound) {
      const round = activeRound.choices.length === 5
        ? activeRound
        : await this.movieQuizRepository.updateRoundChoices(
            activeRound.id,
            await this.createChoices(activeRound),
          );
      return toMovieQuizRoundResponse(round);
    }

    const failedRound = await this.movieQuizRepository.findTodayFailedRound(
      userId,
      getKoreaDayStart(),
    );
    if (failedRound) {
      return toMovieQuizRoundResponse(failedRound);
    }

    const quiz = await this.findOrCreateQuiz();
    const round = await this.movieQuizRepository.createRound({
      userId,
      quizId: quiz.id,
      choices: await this.createChoices({ quiz }),
    });
    return toMovieQuizRoundResponse(round);
  }

  async answer(
    userId: string,
    roundId: string,
    dto: AnswerMovieQuizRequestDto,
  ): Promise<MovieQuizRoundResponseDto> {
    const round = await this.movieQuizRepository.findRoundById(userId, roundId);
    if (!round) throw new NotFoundException("퀴즈 라운드를 찾을 수 없음");
    if (round.status !== MovieQuizRoundStatus.ACTIVE) {
      return toMovieQuizRoundResponse(round);
    }

    const attempts = round.attempts + 1;
    const isCorrect = this.isCorrectAnswer(round, dto.choice);
    const updatedRound = await this.movieQuizRepository.updateRound({
      roundId: round.id,
      attempts,
      status: isCorrect
        ? MovieQuizRoundStatus.CORRECT
        : attempts >= MAX_QUIZ_ATTEMPTS
          ? MovieQuizRoundStatus.FAILED
          : MovieQuizRoundStatus.ACTIVE,
      scoreAwarded: isCorrect ? (attempts === 1 ? 100 : 60) : 0,
      completedAt: isCorrect || attempts >= MAX_QUIZ_ATTEMPTS ? new Date() : null,
    });

    return toMovieQuizRoundResponse(updatedRound);
  }

  async createUserQuiz(userId: string, dto: CreateMovieQuizRequestDto) {
    const movie = await this.movieQuizRepository.findPublicMovie(dto.movieId);
    if (!movie) throw new NotFoundException("출제할 영화를 찾을 수 없음");

    return this.movieQuizRepository.createUserQuiz({
      userId,
      movieId: dto.movieId,
      prompt: dto.prompt.trim(),
    });
  }

  async getWeeklyLeaderboard(): Promise<MovieQuizLeaderboardEntryResponseDto[]> {
    return this.movieQuizRepository.findWeeklyLeaderboard(getWeekStart());
  }

  private async findOrCreateQuiz() {
    const quizzes = await this.movieQuizRepository.findPublishedQuizCandidates();
    if (quizzes.length > 0) {
      return quizzes[Math.floor(Math.random() * quizzes.length)];
    }

    const movies = await this.movieQuizRepository.findQuizCandidateMovie();
    const movie = movies[Math.floor(Math.random() * movies.length)];
    if (!movie) throw new NotFoundException("출제할 영화 데이터가 아직 충분하지 않음");

    return this.movieQuizRepository.createCinemoQuiz({
      movieId: movie.id,
      prompt: createCinemoQuizPrompt(movie.overview ?? "", movie.titles.map((title) => title.title)),
    });
  }

  private async createChoices(round: {
    quiz: { movie: { id: string; titles: Array<{ title: string; titleType: string }> } };
  }) {
    const answer = round.quiz.movie.titles.find((title) => title.titleType === "PRIMARY")?.title;
    if (!answer) throw new NotFoundException("퀴즈 정답 영화를 찾을 수 없음");

    const candidates = await this.movieQuizRepository.findChoiceTitles(round.quiz.movie.id);
    const seen = new Set([normalizeQuizAnswer(answer)]);
    const wrongChoices = candidates
      .map((candidate) => candidate.title)
      .filter((title) => {
        const normalized = normalizeQuizAnswer(title);
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    if (wrongChoices.length < 4) {
      throw new NotFoundException("퀴즈 선택지를 만들 영화 데이터가 부족함");
    }

    return [answer, ...wrongChoices].sort(() => Math.random() - 0.5);
  }

  private isCorrectAnswer(
    round: Awaited<ReturnType<MovieQuizRepository["findRoundById"]>> extends infer T
      ? Exclude<T, null>
      : never,
    answer: string,
  ) {
    const normalizedAnswer = normalizeQuizAnswer(answer);
    if (!normalizedAnswer) return false;

    return round.quiz.movie.titles.some(
      (title) => normalizeQuizAnswer(title.title) === normalizedAnswer,
    );
  }
}
