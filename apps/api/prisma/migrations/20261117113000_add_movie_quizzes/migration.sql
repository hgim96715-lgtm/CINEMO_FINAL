CREATE TYPE "MovieQuizSource" AS ENUM ('CINEMO', 'USER');
CREATE TYPE "MovieQuizStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'DELETED');
CREATE TYPE "MovieQuizRoundStatus" AS ENUM ('ACTIVE', 'CORRECT', 'FAILED');

CREATE TABLE "movie_quizzes" (
  "id" UUID NOT NULL,
  "movie_id" UUID NOT NULL,
  "author_id" UUID,
  "source" "MovieQuizSource" NOT NULL DEFAULT 'CINEMO',
  "status" "MovieQuizStatus" NOT NULL DEFAULT 'PUBLISHED',
  "prompt" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "movie_quizzes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "movie_quizzes_movie_id_fkey"
    FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "movie_quizzes_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "movie_quiz_rounds" (
  "id" UUID NOT NULL,
  "quiz_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "status" "MovieQuizRoundStatus" NOT NULL DEFAULT 'ACTIVE',
  "score_awarded" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(3),

  CONSTRAINT "movie_quiz_rounds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "movie_quiz_rounds_quiz_id_fkey"
    FOREIGN KEY ("quiz_id") REFERENCES "movie_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "movie_quiz_rounds_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "movie_quizzes_status_created_at_idx" ON "movie_quizzes"("status", "created_at");
CREATE INDEX "movie_quizzes_movie_id_idx" ON "movie_quizzes"("movie_id");
CREATE INDEX "movie_quizzes_author_id_idx" ON "movie_quizzes"("author_id");
CREATE INDEX "movie_quiz_rounds_user_id_started_at_idx" ON "movie_quiz_rounds"("user_id", "started_at");
CREATE INDEX "movie_quiz_rounds_status_started_at_idx" ON "movie_quiz_rounds"("status", "started_at");
