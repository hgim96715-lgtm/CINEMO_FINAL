-- CreateEnum
CREATE TYPE "UniverseStampTexture" AS ENUM ('INK', 'PAPER', 'GRAIN', 'GLOW');

-- CreateEnum
CREATE TYPE "UniverseConstellationType" AS ENUM ('GENRE', 'CURATION', 'PLATFORM', 'YEAR', 'CUSTOM');

-- CreateTable
CREATE TABLE "universe_stars" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "user_movie_record_id" UUID NOT NULL,
    "discovered_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position_x" DOUBLE PRECISION NOT NULL,
    "position_y" DOUBLE PRECISION NOT NULL,
    "depth" DOUBLE PRECISION NOT NULL,
    "brightness" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "universe_stars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_stamps" (
    "id" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "primary_color" VARCHAR(7) NOT NULL,
    "accent_color" VARCHAR(7) NOT NULL,
    "texture" "UniverseStampTexture" NOT NULL,
    "emblem" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movie_stamps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universe_constellations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "UniverseConstellationType" NOT NULL,
    "description" TEXT,
    "line_color" VARCHAR(7) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "universe_constellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universe_star_constellations" (
    "id" UUID NOT NULL,
    "star_id" UUID NOT NULL,
    "constellation_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "universe_star_constellations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universe_stars_user_movie_record_id_key" ON "universe_stars"("user_movie_record_id");

-- CreateIndex
CREATE INDEX "universe_stars_userId_discovered_at_idx" ON "universe_stars"("userId", "discovered_at");

-- CreateIndex
CREATE INDEX "universe_stars_movieId_idx" ON "universe_stars"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "universe_stars_userId_movieId_key" ON "universe_stars"("userId", "movieId");

-- CreateIndex
CREATE UNIQUE INDEX "movie_stamps_movieId_key" ON "movie_stamps"("movieId");

-- CreateIndex
CREATE INDEX "movie_stamps_is_active_idx" ON "movie_stamps"("is_active");

-- CreateIndex
CREATE INDEX "universe_constellations_userId_type_idx" ON "universe_constellations"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "universe_constellations_userId_type_title_key" ON "universe_constellations"("userId", "type", "title");

-- CreateIndex
CREATE INDEX "universe_star_constellations_constellation_id_idx" ON "universe_star_constellations"("constellation_id");

-- CreateIndex
CREATE UNIQUE INDEX "universe_star_constellations_star_id_constellation_id_key" ON "universe_star_constellations"("star_id", "constellation_id");

-- AddForeignKey
ALTER TABLE "universe_stars" ADD CONSTRAINT "universe_stars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universe_stars" ADD CONSTRAINT "universe_stars_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universe_stars" ADD CONSTRAINT "universe_stars_user_movie_record_id_fkey" FOREIGN KEY ("user_movie_record_id") REFERENCES "user_movie_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_stamps" ADD CONSTRAINT "movie_stamps_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universe_constellations" ADD CONSTRAINT "universe_constellations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universe_star_constellations" ADD CONSTRAINT "universe_star_constellations_star_id_fkey" FOREIGN KEY ("star_id") REFERENCES "universe_stars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universe_star_constellations" ADD CONSTRAINT "universe_star_constellations_constellation_id_fkey" FOREIGN KEY ("constellation_id") REFERENCES "universe_constellations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
