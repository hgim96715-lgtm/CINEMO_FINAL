-- CreateTable
CREATE TABLE "user_person_bookmarks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_person_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_person_bookmarks_personId_idx" ON "user_person_bookmarks"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "user_person_bookmarks_userId_personId_key" ON "user_person_bookmarks"("userId", "personId");

-- AddForeignKey
ALTER TABLE "user_person_bookmarks" ADD CONSTRAINT "user_person_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_person_bookmarks" ADD CONSTRAINT "user_person_bookmarks_personId_fkey" FOREIGN KEY ("personId") REFERENCES "movie_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
