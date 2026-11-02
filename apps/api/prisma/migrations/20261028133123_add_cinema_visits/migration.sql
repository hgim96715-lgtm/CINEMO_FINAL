-- CreateEnum
CREATE TYPE "CinemaVisitVerificationType" AS ENUM ('MANUAL', 'LOCATION', 'RECEIPT', 'RESERVATION');

-- CreateEnum
CREATE TYPE "CinemaVisitVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "cinema_visits" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "movieRecordId" UUID,
    "visitedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationType" "CinemaVisitVerificationType" NOT NULL DEFAULT 'MANUAL',
    "verificationStatus" "CinemaVisitVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMPTZ(3),
    "note" TEXT,
    "evidenceMetadata" JSONB,
    "idempotencyKey" VARCHAR(100) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cinema_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cinema_visits_userId_visitedAt_idx" ON "cinema_visits"("userId", "visitedAt");

-- CreateIndex
CREATE INDEX "cinema_visits_userId_venueId_visitedAt_idx" ON "cinema_visits"("userId", "venueId", "visitedAt");

-- CreateIndex
CREATE INDEX "cinema_visits_venueId_visitedAt_idx" ON "cinema_visits"("venueId", "visitedAt");

-- CreateIndex
CREATE INDEX "cinema_visits_userId_verificationStatus_idx" ON "cinema_visits"("userId", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "cinema_visits_userId_idempotencyKey_key" ON "cinema_visits"("userId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "cinema_visits" ADD CONSTRAINT "cinema_visits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cinema_visits" ADD CONSTRAINT "cinema_visits_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cinema_visits" ADD CONSTRAINT "cinema_visits_movieRecordId_fkey" FOREIGN KEY ("movieRecordId") REFERENCES "user_movie_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "venues_type_is_active_region1_code_region2_code_region3_code_id" RENAME TO "venues_type_is_active_region1_code_region2_code_region3_cod_idx";
