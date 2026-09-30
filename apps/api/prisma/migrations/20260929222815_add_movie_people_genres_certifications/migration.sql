-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('DIRECTOR', 'ACTOR');

-- CreateTable
CREATE TABLE "movie_people" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_credits" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "creditType" "CreditType" NOT NULL,
    "characterName" TEXT,
    "displayOrder" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_genres" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "code" VARCHAR(50),
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_certifications" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "auditNo" TEXT NOT NULL,
    "watchGradeName" VARCHAR(100) NOT NULL,
    "sourceProvider" "SourceProvider" NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_people_name_idx" ON "movie_people"("name");

-- CreateIndex
CREATE INDEX "movie_people_nameEn_idx" ON "movie_people"("nameEn");

-- CreateIndex
CREATE INDEX "movie_credits_personId_creditType_idx" ON "movie_credits"("personId", "creditType");

-- CreateIndex
CREATE INDEX "movie_credits_movieId_creditType_idx" ON "movie_credits"("movieId", "creditType");

-- CreateIndex
CREATE UNIQUE INDEX "movie_credits_movieId_personId_creditType_key" ON "movie_credits"("movieId", "personId", "creditType");

-- CreateIndex
CREATE INDEX "movie_genres_name_idx" ON "movie_genres"("name");

-- CreateIndex
CREATE INDEX "movie_genres_code_idx" ON "movie_genres"("code");

-- CreateIndex
CREATE UNIQUE INDEX "movie_genres_movieId_name_key" ON "movie_genres"("movieId", "name");

-- CreateIndex
CREATE INDEX "movie_certifications_movieId_idx" ON "movie_certifications"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "movie_certifications_sourceProvider_auditNo_key" ON "movie_certifications"("sourceProvider", "auditNo");

-- AddForeignKey
ALTER TABLE "movie_credits" ADD CONSTRAINT "movie_credits_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_credits" ADD CONSTRAINT "movie_credits_personId_fkey" FOREIGN KEY ("personId") REFERENCES "movie_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_certifications" ADD CONSTRAINT "movie_certifications_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
