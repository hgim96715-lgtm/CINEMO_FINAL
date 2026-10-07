-- 영화 공개 여부와 관리자 검토 상태 추가
CREATE TYPE "MovieVisibility" AS ENUM ('PUBLIC', 'REVIEW', 'HIDDEN');

ALTER TABLE "users"
ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "movies"
ADD COLUMN "visibility" "MovieVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "moderationReason" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMPTZ(3);

CREATE INDEX "movies_visibility_idx" ON "movies"("visibility");

-- 기존 데이터 중 19금 멜로·로맨스는 자동 숨김 처리
UPDATE "movies" AS movie
SET
  "visibility" = 'HIDDEN',
  "moderationReason" = '자동 분류: 19금 멜로/로맨스',
  "reviewedAt" = NULL
WHERE EXISTS (
  SELECT 1
  FROM "movie_genres" AS genre
  WHERE genre."movieId" = movie."id"
    AND (
      genre."name" ILIKE '%멜로%'
      OR genre."name" ILIKE '%로맨스%'
    )
)
AND EXISTS (
  SELECT 1
  FROM "movie_certifications" AS certification
  WHERE certification."movieId" = movie."id"
    AND (
      replace(certification."watchGradeName", ' ', '') ILIKE '%청소년관람불가%'
      OR replace(certification."watchGradeName", ' ', '') ILIKE '%19세%'
    )
);

-- 그 외 노골적인 성인물은 관리자 검토 상태로 보냄
UPDATE "movies" AS movie
SET
  "visibility" = 'REVIEW',
  "moderationReason" = '자동 분류: 성인물 검토 필요',
  "reviewedAt" = NULL
WHERE "visibility" = 'PUBLIC'
AND (
  EXISTS (
    SELECT 1
    FROM "movie_titles" AS title
    WHERE title."movieId" = movie."id"
      AND (
        title."title" ILIKE '%체액%'
        OR title."title" ILIKE '%섹스%'
        OR title."title" ILIKE '%야한%'
        OR title."title" ILIKE '%마사지클럽%'
        OR title."title" ILIKE '%19금%'
        OR title."title" ILIKE '%성인물%'
      )
  )
  OR EXISTS (
    SELECT 1
    FROM "movie_genres" AS genre
    WHERE genre."movieId" = movie."id"
      AND (
        genre."name" ILIKE '%성인물%'
        OR genre."name" ILIKE '%에로%'
      )
  )
);
