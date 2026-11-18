import { Module } from "@nestjs/common";

import { PrismaModule } from "@/prisma/prisma.module";
import { MovieQuizController } from "./controllers/movie-quiz.controller";
import { MovieQuizRepository } from "./repositories/movie-quiz.repository";
import { MovieQuizService } from "./services/movie-quiz.service";

@Module({
  imports: [PrismaModule],
  controllers: [MovieQuizController],
  providers: [MovieQuizRepository, MovieQuizService],
})
export class MovieQuizzesModule {}
