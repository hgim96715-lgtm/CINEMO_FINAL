-- 링크 공개 엽서는 기존 비공개 엽서로 보존함.
UPDATE "postcards"
SET "visibility" = 'PRIVATE'
WHERE "visibility" = 'UNLISTED';

CREATE TYPE "PostcardVisibility_new" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "postcards"
ALTER COLUMN "visibility" TYPE "PostcardVisibility_new"
USING ("visibility"::text::"PostcardVisibility_new");

ALTER TYPE "PostcardVisibility" RENAME TO "PostcardVisibility_old";
ALTER TYPE "PostcardVisibility_new" RENAME TO "PostcardVisibility";
DROP TYPE "PostcardVisibility_old";

ALTER TABLE "postcards"
ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE';
