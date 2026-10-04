-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "overview" TEXT,
ADD COLUMN     "runtime" INTEGER,
ADD COLUMN     "tmdbVoteAverage" DECIMAL(3,1),
ADD COLUMN     "tmdbVoteCount" INTEGER;
