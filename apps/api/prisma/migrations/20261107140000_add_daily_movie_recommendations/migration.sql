CREATE TABLE "daily_movie_picks" (
  "day" CHAR(10) PRIMARY KEY,
  "movie_id" UUID NOT NULL REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "copy" VARCHAR(160) NOT NULL
);
CREATE INDEX "daily_movie_picks_movie_id_idx" ON "daily_movie_picks"("movie_id");

CREATE TABLE "daily_movie_preferences" (
  "user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "push_token_id" UUID NOT NULL REFERENCES "push_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "enabled_at" TIMESTAMPTZ(3) NOT NULL,
  "last_visit_at" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX "daily_movie_preferences_push_token_id_idx" ON "daily_movie_preferences"("push_token_id");
CREATE INDEX "daily_movie_preferences_last_visit_at_idx" ON "daily_movie_preferences"("last_visit_at");

CREATE TABLE "daily_movie_deliveries" (
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "day" CHAR(10) NOT NULL,
  "attempted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id", "day")
);
