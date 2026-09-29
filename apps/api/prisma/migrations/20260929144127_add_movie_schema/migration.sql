-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('PRIMARY', 'ORIGINAL', 'ALIAS', 'RERELEASE');

-- CreateEnum
CREATE TYPE "ReleaseType" AS ENUM ('INITIAL', 'RERELEASE');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('ANNOUNCED', 'SCHEDULED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SourceProvider" AS ENUM ('KOBIS', 'TMDB', 'KMDB', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "MatchMethod" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('POSTER', 'BACKDROP', 'TRAILER');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WatchProvider" AS ENUM ('NETFLIX', 'WATCHA', 'TVING', 'DISNEY_PLUS', 'WAVVE', 'APPLE_TV');

-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('STREAM', 'RENT', 'BUY');

-- CreateTable
CREATE TABLE "movies" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_titles" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "releaseId" UUID,
    "title" TEXT NOT NULL,
    "titleType" "TitleType" NOT NULL,
    "languageCode" VARCHAR(10),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_releases" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "releaseDate" DATE,
    "releaseType" "ReleaseType" NOT NULL,
    "status" "ReleaseStatus" NOT NULL,
    "countryCode" CHAR(2),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_provider_links" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "sourceProvider" "SourceProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "matchMethod" "MatchMethod" NOT NULL,
    "matchStatus" "MatchStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "confidence" DECIMAL(5,4),
    "verifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_provider_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_media" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "releaseId" UUID,
    "mediaType" "MediaType" NOT NULL,
    "sourceProvider" "SourceProvider" NOT NULL,
    "url" TEXT NOT NULL,
    "externalId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "MediaStatus" NOT NULL DEFAULT 'ACTIVE',
    "verifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_watch_options" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "watchProvider" "WatchProvider" NOT NULL,
    "availabilityType" "AvailabilityType" NOT NULL,
    "regionCode" VARCHAR(10) NOT NULL DEFAULT 'KR',
    "url" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3),
    "lastVerifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_watch_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_ranking_snapshots" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "sourceProvider" "SourceProvider" NOT NULL,
    "rank" INTEGER NOT NULL,
    "audienceCount" INTEGER,
    "collectedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_titles_movieId_titleType_idx" ON "movie_titles"("movieId", "titleType");

-- CreateIndex
CREATE INDEX "movie_titles_releaseId_idx" ON "movie_titles"("releaseId");

-- CreateIndex
CREATE INDEX "movie_releases_movieId_isPrimary_idx" ON "movie_releases"("movieId", "isPrimary");

-- CreateIndex
CREATE INDEX "movie_releases_status_releaseDate_idx" ON "movie_releases"("status", "releaseDate");

-- CreateIndex
CREATE INDEX "movie_provider_links_movieId_matchStatus_idx" ON "movie_provider_links"("movieId", "matchStatus");

-- CreateIndex
CREATE UNIQUE INDEX "movie_provider_links_sourceProvider_externalId_key" ON "movie_provider_links"("sourceProvider", "externalId");

-- CreateIndex
CREATE INDEX "movie_media_movieId_mediaType_isPrimary_idx" ON "movie_media"("movieId", "mediaType", "isPrimary");

-- CreateIndex
CREATE INDEX "movie_media_releaseId_idx" ON "movie_media"("releaseId");

-- CreateIndex
CREATE INDEX "movie_watch_options_movieId_regionCode_idx" ON "movie_watch_options"("movieId", "regionCode");

-- CreateIndex
CREATE INDEX "movie_watch_options_watchProvider_availabilityType_idx" ON "movie_watch_options"("watchProvider", "availabilityType");

-- CreateIndex
CREATE INDEX "movie_ranking_snapshots_sourceProvider_collectedAt_rank_idx" ON "movie_ranking_snapshots"("sourceProvider", "collectedAt", "rank");

-- CreateIndex
CREATE INDEX "movie_ranking_snapshots_movieId_collectedAt_idx" ON "movie_ranking_snapshots"("movieId", "collectedAt");

-- AddForeignKey
ALTER TABLE "movie_titles" ADD CONSTRAINT "movie_titles_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_titles" ADD CONSTRAINT "movie_titles_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "movie_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_releases" ADD CONSTRAINT "movie_releases_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_provider_links" ADD CONSTRAINT "movie_provider_links_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_media" ADD CONSTRAINT "movie_media_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_media" ADD CONSTRAINT "movie_media_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "movie_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_watch_options" ADD CONSTRAINT "movie_watch_options_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_ranking_snapshots" ADD CONSTRAINT "movie_ranking_snapshots_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
