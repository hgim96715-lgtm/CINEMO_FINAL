-- CreateEnum
CREATE TYPE "UserActivityType" AS ENUM (
    'LOGIN',
    'LOGOUT',
    'MOVIE_RECORD_UPSERT',
    'MOVIE_RECORD_DELETE',
    'MOVIE_NOTIFICATION_SUBSCRIBE',
    'MOVIE_NOTIFICATION_UNSUBSCRIBE',
    'CINEMA_VISIT_CREATE',
    'CINEMA_VISIT_DELETE',
    'POSTCARD_CREATE',
    'POSTCARD_UPDATE',
    'POSTCARD_PUBLISH',
    'POSTCARD_DELETE',
    'POSTCARD_COMMENT_CREATE',
    'POSTCARD_REACTION_ADD',
    'POSTCARD_REACTION_REMOVE',
    'POSTCARD_BOOKMARK_ADD',
    'POSTCARD_BOOKMARK_REMOVE',
    'PERSON_BOOKMARK_ADD',
    'PERSON_BOOKMARK_REMOVE'
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "UserActivityType" NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_activity_logs_userId_createdAt_idx" ON "user_activity_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "user_activity_logs_type_createdAt_idx" ON "user_activity_logs"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
