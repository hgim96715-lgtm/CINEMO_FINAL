ALTER TABLE "daily_movie_push_settings"
  DROP CONSTRAINT "daily_movie_push_settings_weekdays_check",
  ADD CONSTRAINT "daily_movie_push_settings_weekdays_check"
    CHECK (cardinality("weekdays") BETWEEN 1 AND 7 AND "weekdays" <@ ARRAY[0,1,2,3,4,5,6]);

UPDATE "daily_movie_push_settings"
SET "weekdays" = ARRAY[0,1,2,3,4,5,6];
