-- CreateTable
CREATE TABLE "movie_popularity_snapshots" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "collectedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_popularity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_popularity_snapshots_collectedAt_rank_idx" ON "movie_popularity_snapshots"("collectedAt", "rank");

-- CreateIndex
CREATE INDEX "movie_popularity_snapshots_movieId_collectedAt_idx" ON "movie_popularity_snapshots"("movieId", "collectedAt");

-- AddForeignKey
ALTER TABLE "movie_popularity_snapshots" ADD CONSTRAINT "movie_popularity_snapshots_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
