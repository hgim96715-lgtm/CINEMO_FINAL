ALTER TABLE "movie_quiz_rounds"
ADD COLUMN "choices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
