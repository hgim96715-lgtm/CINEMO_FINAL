ALTER TABLE "venues"
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "venues_type_is_active_region1_code_region2_code_region3_code_idx"
ON "venues"("type", "is_active", "region1_code", "region2_code", "region3_code");
