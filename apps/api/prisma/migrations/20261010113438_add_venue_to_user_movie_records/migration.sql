-- AlterTable
ALTER TABLE "user_movie_records" ADD COLUMN     "venue_id" UUID;

-- CreateIndex
CREATE INDEX "user_movie_records_userId_venue_id_idx" ON "user_movie_records"("userId", "venue_id");

-- AddForeignKey
ALTER TABLE "user_movie_records" ADD CONSTRAINT "user_movie_records_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "cinema_venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
