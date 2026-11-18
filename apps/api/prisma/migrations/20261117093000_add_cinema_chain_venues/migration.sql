-- 카카오 장소(Venue)와 CGV·롯데시네마·메가박스 공식 극장 코드를 연결한다.
CREATE TABLE "cinema_chain_venues" (
  "id" UUID NOT NULL,
  "venue_id" UUID NOT NULL,
  "chain" "TheaterExclusive" NOT NULL,
  "external_code" TEXT NOT NULL,
  "official_name" TEXT,
  "booking_url" TEXT,
  "checked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "cinema_chain_venues_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cinema_chain_venues_venue_id_chain_key" UNIQUE ("venue_id", "chain"),
  CONSTRAINT "cinema_chain_venues_chain_external_code_key" UNIQUE ("chain", "external_code"),
  CONSTRAINT "cinema_chain_venues_venue_id_fkey"
    FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "cinema_chain_venues_chain_idx" ON "cinema_chain_venues"("chain");
