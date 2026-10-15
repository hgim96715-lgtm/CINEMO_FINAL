CREATE TYPE "PostcardType_new" AS ENUM ('REVIEW', 'QUOTE', 'SCENE');

ALTER TABLE "postcards"
ALTER COLUMN "type" TYPE "PostcardType_new"
USING ("type"::text::"PostcardType_new");

ALTER TABLE "postcard_generations"
ALTER COLUMN "type" TYPE "PostcardType_new"
USING ("type"::text::"PostcardType_new");

ALTER TYPE "PostcardType" RENAME TO "PostcardType_old";
ALTER TYPE "PostcardType_new" RENAME TO "PostcardType";
DROP TYPE "PostcardType_old";
