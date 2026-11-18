-- 사용자가 오늘의 영화 알림을 해제한 상태를 유지한다.
ALTER TABLE "daily_movie_preferences"
ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
