-- CreateEnum
CREATE TYPE "VenueType" AS ENUM (
    'CINEMA',
    'HOME',
    'MUSEUM',
    'EXHIBITION_HALL',
    'PERFORMANCE_HALL',
    'OTHER'
);

-- Rename the existing table so it can contain every viewing location.
ALTER TABLE "cinema_venues" RENAME TO "venues";

-- Keep existing records as movie theaters while making the model extensible.
ALTER TABLE "venues"
    ADD COLUMN "type" "VenueType" NOT NULL DEFAULT 'OTHER';

ALTER TABLE "venues"
    ALTER COLUMN "provider" DROP NOT NULL,
    ALTER COLUMN "external_id" DROP NOT NULL,
    ALTER COLUMN "region1_code" DROP NOT NULL,
    ALTER COLUMN "region1_name" DROP NOT NULL,
    ALTER COLUMN "latitude" DROP NOT NULL,
    ALTER COLUMN "longitude" DROP NOT NULL;

CREATE INDEX "venues_type_idx" ON "venues"("type");

ALTER INDEX "cinema_venues_pkey" RENAME TO "venues_pkey";
ALTER INDEX "cinema_venues_region1_code_region2_code_region3_code_idx"
    RENAME TO "venues_region1_code_region2_code_region3_code_idx";
ALTER INDEX "cinema_venues_name_idx" RENAME TO "venues_name_idx";
ALTER INDEX "cinema_venues_brand_name_idx" RENAME TO "venues_brand_name_idx";
ALTER INDEX "cinema_venues_h_code_idx" RENAME TO "venues_h_code_idx";
ALTER INDEX "cinema_venues_b_code_idx" RENAME TO "venues_b_code_idx";
ALTER INDEX "cinema_venues_provider_external_id_key"
    RENAME TO "venues_provider_external_id_key";
