-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "production_country_codes" TEXT[] DEFAULT ARRAY[]::TEXT[];
