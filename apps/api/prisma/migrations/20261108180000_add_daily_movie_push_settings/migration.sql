CREATE TABLE "daily_movie_push_settings" (
  "id" INTEGER PRIMARY KEY CHECK ("id" = 1),
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "weekdays" INTEGER[] NOT NULL CHECK (cardinality("weekdays") BETWEEN 1 AND 2 AND "weekdays" <@ ARRAY[0,1,2,3,4,5,6]),
  "hour" INTEGER NOT NULL CHECK ("hour" BETWEEN 0 AND 23),
  "title" VARCHAR(60) NOT NULL,
  "body" VARCHAR(180) NOT NULL
);
