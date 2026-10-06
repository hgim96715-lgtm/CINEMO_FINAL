-- CreateTable
CREATE TABLE "user_movie_records" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "watchedAt" TIMESTAMPTZ(3),
    "rating" DECIMAL(2,1),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_movie_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_movie_records_userId_isFavorite_idx" ON "user_movie_records"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "user_movie_records_userId_watchedAt_idx" ON "user_movie_records"("userId", "watchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_movie_records_userId_movieId_key" ON "user_movie_records"("userId", "movieId");

-- AddForeignKey
ALTER TABLE "user_movie_records" ADD CONSTRAINT "user_movie_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_movie_records" ADD CONSTRAINT "user_movie_records_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
