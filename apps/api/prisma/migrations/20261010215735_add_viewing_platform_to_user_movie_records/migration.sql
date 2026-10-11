-- CreateEnum
CREATE TYPE "ViewingPlatform" AS ENUM ('NETFLIX', 'WATCHA', 'TVING', 'DISNEY_PLUS', 'WAVVE', 'APPLE_TV', 'TV', 'OTHER');

-- AlterTable
ALTER TABLE "user_movie_records" ADD COLUMN     "viewingPlatform" "ViewingPlatform";
