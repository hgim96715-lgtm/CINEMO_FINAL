-- AlterTable
ALTER TABLE "movie_watch_options" ADD COLUMN     "logo_path" VARCHAR(255),
ADD COLUMN     "tmdb_provider_id" INTEGER;

-- CreateIndex
CREATE INDEX "movie_watch_options_tmdb_provider_id_regionCode_idx" ON "movie_watch_options"("tmdb_provider_id", "regionCode");
