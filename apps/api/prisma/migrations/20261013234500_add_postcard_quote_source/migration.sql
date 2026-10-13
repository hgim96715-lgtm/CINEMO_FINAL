-- CreateEnum
CREATE TYPE "PostcardQuoteSource" AS ENUM ('USER', 'OPENSUBTITLES');

-- AlterTable
ALTER TABLE "postcards"
ADD COLUMN "quote_source" "PostcardQuoteSource";
