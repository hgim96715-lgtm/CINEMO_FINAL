import { HttpStatus } from "@nestjs/common";

import { AppException } from "./app.exception";

export class MovieNotFoundException extends AppException {
  constructor(movieId: string) {
    super({
      code: "MOVIE_NOT_FOUND",
      message: "영화를 찾을 수 없습니다.",
      status: HttpStatus.NOT_FOUND,
      details: {
        movieId,
      },
    });
  }
}
