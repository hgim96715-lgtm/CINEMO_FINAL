-- CreateEnum
CREATE TYPE "PostcardMediaType" AS ENUM ('IMAGE', 'CAPTURE');

-- AlterTable
ALTER TABLE "postcards" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "style" JSONB;

-- CreateTable
CREATE TABLE "postcard_media" (
    "id" UUID NOT NULL,
    "postcardId" UUID NOT NULL,
    "type" "PostcardMediaType" NOT NULL,
    "url" VARCHAR(2048),
    "storage_key" VARCHAR(512),
    "alt_text" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "postcard_media_postcardId_sort_order_created_at_idx" ON "postcard_media"("postcardId", "sort_order", "created_at");

-- AddForeignKey
ALTER TABLE "postcard_media" ADD CONSTRAINT "postcard_media_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
