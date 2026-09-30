-- CreateTable
CREATE TABLE "movie_person_provider_links" (
    "id" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "sourceProvider" "SourceProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_person_provider_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movie_person_provider_links_personId_idx" ON "movie_person_provider_links"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "movie_person_provider_links_sourceProvider_externalId_key" ON "movie_person_provider_links"("sourceProvider", "externalId");

-- AddForeignKey
ALTER TABLE "movie_person_provider_links" ADD CONSTRAINT "movie_person_provider_links_personId_fkey" FOREIGN KEY ("personId") REFERENCES "movie_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
