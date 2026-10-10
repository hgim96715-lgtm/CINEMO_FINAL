-- AlterTable
ALTER TABLE "cinema_venues" ADD COLUMN     "b_code" VARCHAR(10),
ADD COLUMN     "h_code" VARCHAR(10);

-- CreateIndex
CREATE INDEX "cinema_venues_h_code_idx" ON "cinema_venues"("h_code");

-- CreateIndex
CREATE INDEX "cinema_venues_b_code_idx" ON "cinema_venues"("b_code");
