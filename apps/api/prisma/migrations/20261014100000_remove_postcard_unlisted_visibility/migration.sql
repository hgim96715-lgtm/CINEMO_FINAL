-- 링크 공개 엽서는 기존 비공개 엽서로 보존함.
UPDATE "postcards"
SET "visibility" = 'PRIVATE'
WHERE "visibility" = 'UNLISTED';

-- 기존 enum 타입을 참조하는 기본값을 먼저 제거해야 새 enum 타입으로 변경할 수 있음.
ALTER TABLE "postcards"
ALTER COLUMN "visibility" DROP DEFAULT;

CREATE TYPE "PostcardVisibility_new" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "postcards"
ALTER COLUMN "visibility" TYPE "PostcardVisibility_new"
USING ("visibility"::text::"PostcardVisibility_new");

ALTER TYPE "PostcardVisibility" RENAME TO "PostcardVisibility_old";
ALTER TYPE "PostcardVisibility_new" RENAME TO "PostcardVisibility";
DROP TYPE "PostcardVisibility_old";

ALTER TABLE "postcards"
ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE';
