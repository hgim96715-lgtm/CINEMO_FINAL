ALTER TABLE "users"
  ADD COLUMN "daily_movie_weather_nx" INTEGER,
  ADD COLUMN "daily_movie_weather_ny" INTEGER,
  ADD CONSTRAINT "daily_movie_weather_grid_check" CHECK (
    ("daily_movie_weather_nx" IS NULL AND "daily_movie_weather_ny" IS NULL)
    OR ("daily_movie_weather_nx" IS NOT NULL AND "daily_movie_weather_ny" IS NOT NULL
      AND "daily_movie_weather_nx" BETWEEN 1 AND 149 AND "daily_movie_weather_ny" BETWEEN 1 AND 253)
  );
