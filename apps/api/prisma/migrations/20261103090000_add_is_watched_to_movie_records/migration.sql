ALTER TABLE "user_movie_records"
ADD COLUMN "is_watched" BOOLEAN NOT NULL DEFAULT false;

UPDATE "user_movie_records"
SET "is_watched" = true
WHERE "watchedAt" IS NOT NULL;

CREATE INDEX "user_movie_records_userId_is_watched_idx"
ON "user_movie_records"("userId", "is_watched");
