CREATE TABLE "service_visits" (
  "id" CHAR(64) PRIMARY KEY,
  "day" CHAR(10) NOT NULL,
  "channel" VARCHAR(8) NOT NULL,
  "visitor_key" CHAR(64) NOT NULL,
  "authenticated" BOOLEAN NOT NULL
);

CREATE INDEX "service_visits_day_channel_idx" ON "service_visits"("day", "channel");
