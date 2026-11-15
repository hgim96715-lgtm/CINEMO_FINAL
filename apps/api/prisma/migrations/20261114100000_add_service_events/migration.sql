CREATE TABLE "service_events" (
  "id" CHAR(64) NOT NULL,
  "day" CHAR(10) NOT NULL,
  "channel" VARCHAR(8) NOT NULL,
  "type" VARCHAR(32) NOT NULL,
  "visitor_key" CHAR(64) NOT NULL,
  "authenticated" BOOLEAN NOT NULL,
  CONSTRAINT "service_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_events_day_channel_type_idx"
ON "service_events"("day", "channel", "type");

CREATE INDEX "service_events_day_channel_visitor_key_idx"
ON "service_events"("day", "channel", "visitor_key");
