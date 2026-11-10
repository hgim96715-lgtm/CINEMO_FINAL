CREATE TYPE "TheaterExclusive" AS ENUM ('CGV', 'MEGABOX', 'LOTTE_CINEMA');

ALTER TABLE "movie_releases"
  ADD COLUMN "theaterExclusive" "TheaterExclusive";
