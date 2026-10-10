-- CreateEnum
CREATE TYPE "MapProvider" AS ENUM ('KAKAO');

-- CreateTable
CREATE TABLE "cinema_venues" (
    "id" UUID NOT NULL,
    "provider" "MapProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand_name" TEXT,
    "region1_code" TEXT NOT NULL,
    "region1_name" TEXT NOT NULL,
    "region2_code" TEXT,
    "region2_name" TEXT,
    "region3_code" TEXT,
    "region3_name" TEXT,
    "road_address" TEXT,
    "jibun_address" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "phone" TEXT,
    "place_url" TEXT,
    "checked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cinema_venues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cinema_venues_region1_code_region2_code_region3_code_idx" ON "cinema_venues"("region1_code", "region2_code", "region3_code");

-- CreateIndex
CREATE INDEX "cinema_venues_name_idx" ON "cinema_venues"("name");

-- CreateIndex
CREATE INDEX "cinema_venues_brand_name_idx" ON "cinema_venues"("brand_name");

-- CreateIndex
CREATE UNIQUE INDEX "cinema_venues_provider_external_id_key" ON "cinema_venues"("provider", "external_id");
