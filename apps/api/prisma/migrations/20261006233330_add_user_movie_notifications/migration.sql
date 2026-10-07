-- CreateEnum
CREATE TYPE "MovieNotificationType" AS ENUM ('RELEASE');

-- CreateTable
CREATE TABLE "user_movie_notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "releaseId" UUID,
    "notificationType" "MovieNotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_movie_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_movie_notifications_movieId_notificationType_enabled_idx" ON "user_movie_notifications"("movieId", "notificationType", "enabled");

-- CreateIndex
CREATE INDEX "user_movie_notifications_releaseId_idx" ON "user_movie_notifications"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "user_movie_notifications_userId_movieId_notificationType_key" ON "user_movie_notifications"("userId", "movieId", "notificationType");

-- AddForeignKey
ALTER TABLE "user_movie_notifications" ADD CONSTRAINT "user_movie_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_movie_notifications" ADD CONSTRAINT "user_movie_notifications_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_movie_notifications" ADD CONSTRAINT "user_movie_notifications_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "movie_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
