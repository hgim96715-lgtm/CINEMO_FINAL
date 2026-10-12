-- AlterTable
ALTER TABLE "movie_people"
ADD COLUMN "tmdb_enriched_at" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "movie_people_tmdb_enriched_at_idx"
ON "movie_people"("tmdb_enriched_at");
