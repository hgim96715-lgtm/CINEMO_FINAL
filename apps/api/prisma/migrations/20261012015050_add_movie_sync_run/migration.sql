-- CreateEnum
CREATE TYPE "MovieSyncJobType" AS ENUM ('INITIAL_IMPORT', 'DAILY_RANKING', 'UPCOMINT_RELEASES', 'MOVIE_ENTICHMENT', 'WATCH_PROVIDER_REFRESH');

-- CreateEnum
CREATE TYPE "MovieSyncStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "movie_sync_runs" (
    "id" UUID NOT NULL,
    "jobType" "MovieSyncJobType" NOT NULL,
    "status" "MovieSyncStatus" NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "currentCursor" TEXT,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_sync_runs_jobType_status_idx" ON "movie_sync_runs"("jobType", "status");

-- CreateIndex
CREATE INDEX "movie_sync_runs_startedAt_idx" ON "movie_sync_runs"("startedAt");
