import { MovieQuizRoundStatus } from "@prisma/client";

import { MovieQuizRoundResponseDto } from "../dto/responses/movie-quiz.response.dto";
import type { MovieQuizRoundRecord } from "../repositories/movie-quiz.repository";

export const MAX_QUIZ_ATTEMPTS = 2;

export function normalizeQuizAnswer(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function getPrimaryMovieTitle(round: MovieQuizRoundRecord) {
  return (
    round.quiz.movie.titles.find((title) => title.titleType === "PRIMARY")?.title ??
    round.quiz.movie.titles[0]?.title ??
    ""
  );
}

export function toMovieQuizRoundResponse(
  round: MovieQuizRoundRecord,
): MovieQuizRoundResponseDto {
  const isFailed = round.status === MovieQuizRoundStatus.FAILED;
  return {
    roundId: round.id,
    prompt:
      round.quiz.source === "CINEMO"
        ? createCinemoQuizPrompt(
            round.quiz.movie.overview ?? "",
            round.quiz.movie.titles.map((title) => title.title),
          )
        : round.quiz.prompt,
    choices: round.choices,
    posterUrl: round.quiz.movie.media[0]?.url ?? null,
    attemptsRemaining: Math.max(0, MAX_QUIZ_ATTEMPTS - round.attempts),
    status: round.status,
    scoreAwarded: round.scoreAwarded,
    ...(isFailed && { answer: getPrimaryMovieTitle(round) }),
  };
}

export function createCinemoQuizPrompt(overview: string, titles: string[]) {
  const maskedOverview = titles.reduce(
    (value, title) => value.replaceAll(title, "이 작품"),
    overview,
  );
  const normalizedOverview = maskedOverview.replace(/\s+/g, " ").trim();
  const sentenceEnd = normalizedOverview.search(/[.!?](?:\s|$)|다\.(?:\s|$)/u);
  return (
    normalizedOverview
      .slice(0, sentenceEnd >= 0 ? sentenceEnd + 1 : 120)
      .slice(0, 120) || "이 영화의 제목은 무엇일까요?"
  );
}

function getKoreaDateAsUtc(value: Date) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(dateParts.find((item) => item.type === type)?.value);

  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
}

export function getKoreaDayStart(value = new Date()) {
  return new Date(getKoreaDateAsUtc(value).getTime() - 9 * 60 * 60 * 1_000);
}

export function getWeekStart(value = new Date()) {
  const koreaDateAsUtc = getKoreaDateAsUtc(value);
  const mondayOffset = (koreaDateAsUtc.getUTCDay() + 6) % 7;

  return new Date(
    koreaDateAsUtc.getTime() -
      mondayOffset * 24 * 60 * 60 * 1_000 -
      9 * 60 * 60 * 1_000,
  );
}
