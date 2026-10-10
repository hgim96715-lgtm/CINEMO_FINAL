-- CreateEnum
CREATE TYPE "ViewingPlaceType" AS ENUM ('HOME', 'VENUE');

-- AlterTable
ALTER TABLE "user_movie_records"
    ADD COLUMN "viewingPlaceType" "ViewingPlaceType";
