-- Normalize existing capture media as regular images before removing the enum value.
UPDATE "postcard_media"
SET "type" = 'IMAGE'
WHERE "type" = 'CAPTURE';

-- PostgreSQL does not support removing an enum value directly.
ALTER TYPE "PostcardMediaType" RENAME TO "PostcardMediaType_old";

CREATE TYPE "PostcardMediaType" AS ENUM ('IMAGE');

ALTER TABLE "postcard_media"
ALTER COLUMN "type" TYPE "PostcardMediaType"
USING "type"::text::"PostcardMediaType";

DROP TYPE "PostcardMediaType_old";
