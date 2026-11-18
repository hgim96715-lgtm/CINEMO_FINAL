import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { Public } from "@/modules/auth/decorators/public.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";
import { AnswerMovieQuizRequestDto } from "../dto/requests/answer-movie-quiz.request.dto";
import { CreateMovieQuizRequestDto } from "../dto/requests/create-movie-quiz.request.dto";
import {
  MovieQuizLeaderboardEntryResponseDto,
  MovieQuizRoundResponseDto,
} from "../dto/responses/movie-quiz.response.dto";
import { MovieQuizService } from "../services/movie-quiz.service";

@ApiTags("Movie Quizzes")
@ApiCookieAuth("cinemo_session")
@Controller("movie-quizzes")
export class MovieQuizController {
  constructor(private readonly movieQuizService: MovieQuizService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get("next")
  @ApiOperation({ summary: "다음 랜덤 영화 퀴즈 시작" })
  @ApiOkResponse({ type: MovieQuizRoundResponseDto })
  startNextRound(@CurrentUser() user: SessionUser) {
    return this.movieQuizService.startNextRound(user.id);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post("rounds/:roundId/answer")
  @ApiOperation({ summary: "영화 퀴즈 정답 제출", description: "오답은 두 번까지 가능하며 정답을 맞혀야 다음 문제로 진행할 수 있음" })
  @ApiOkResponse({ type: MovieQuizRoundResponseDto })
  answer(
    @CurrentUser() user: SessionUser,
    @Param("roundId") roundId: string,
    @Body() dto: AnswerMovieQuizRequestDto,
  ) {
    return this.movieQuizService.answer(user.id, roundId, dto);
  }

  @Get("leaderboard/weekly")
  @Public()
  @ApiOperation({ summary: "이번 주 영화 퀴즈 순위" })
  @ApiOkResponse({ type: [MovieQuizLeaderboardEntryResponseDto] })
  getWeeklyLeaderboard() {
    return this.movieQuizService.getWeeklyLeaderboard();
  }

  @Post()
  @ApiOperation({ summary: "사용자 영화 퀴즈 출제", description: "출제한 문제는 검토 후 퀴즈방에 공개됨" })
  @ApiCreatedResponse({ description: "출제 요청 생성" })
  createUserQuiz(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateMovieQuizRequestDto,
  ) {
    return this.movieQuizService.createUserQuiz(user.id, dto);
  }
}
