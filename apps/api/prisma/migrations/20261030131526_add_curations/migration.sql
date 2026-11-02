-- CreateEnum
CREATE TYPE "CurationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "curations" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "eyebrow" VARCHAR(100) NOT NULL DEFAULT 'CINEMO CURATION',
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "CurationStatus" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMPTZ(3),
    "ends_at" TIMESTAMPTZ(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "curations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curation_movies" (
    "id" UUID NOT NULL,
    "curation_id" UUID NOT NULL,
    "movie_id" UUID NOT NULL,
    "reason" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curation_movies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curations_slug_key" ON "curations"("slug");

-- CreateIndex
CREATE INDEX "curations_status_starts_at_ends_at_idx" ON "curations"("status", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "curations_status_sort_order_idx" ON "curations"("status", "sort_order");

-- CreateIndex
CREATE INDEX "curation_movies_curation_id_sort_order_idx" ON "curation_movies"("curation_id", "sort_order");

-- CreateIndex
CREATE INDEX "curation_movies_movie_id_idx" ON "curation_movies"("movie_id");

-- CreateIndex
CREATE UNIQUE INDEX "curation_movies_curation_id_movie_id_key" ON "curation_movies"("curation_id", "movie_id");

-- AddForeignKey
ALTER TABLE "curation_movies" ADD CONSTRAINT "curation_movies_curation_id_fkey" FOREIGN KEY ("curation_id") REFERENCES "curations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curation_movies" ADD CONSTRAINT "curation_movies_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
