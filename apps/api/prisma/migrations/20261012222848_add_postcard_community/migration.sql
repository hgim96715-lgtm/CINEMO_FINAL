-- CreateEnum
CREATE TYPE "PostcardCommentStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "PostcardNotificationType" AS ENUM ('COMMENT', 'REPLY', 'REACTION', 'MENTION');

-- CreateEnum
CREATE TYPE "PostcardRestrictionType" AS ENUM ('COMMENT', 'INTERACTION', 'ALL');

-- CreateEnum
CREATE TYPE "PostcardType" AS ENUM ('REVIEW', 'QUOTE', 'SCENE', 'NOTE');

-- CreateEnum
CREATE TYPE "PostcardSource" AS ENUM ('USER', 'AI');

-- CreateEnum
CREATE TYPE "PostcardVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "PostcardStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "PostcardGenerationStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PostcardReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PostcardModerationAction" AS ENUM ('HIDE', 'RESTORE', 'DELETE', 'WARN', 'RESTRICT_USER');

-- CreateTable
CREATE TABLE "postcards" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "type" "PostcardType" NOT NULL,
    "source" "PostcardSource" NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "background_style" VARCHAR(100),
    "visibility" "PostcardVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "PostcardStatus" NOT NULL DEFAULT 'DRAFT',
    "reaction_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMPTZ(3),
    "edited_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "postcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_revisions" (
    "id" UUID NOT NULL,
    "postcardId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "source" "PostcardSource" NOT NULL,
    "editorId" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_reactions" (
    "postcardId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_reactions_pkey" PRIMARY KEY ("postcardId","userId","emoji")
);

-- CreateTable
CREATE TABLE "postcard_bookmarks" (
    "postcardId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_bookmarks_pkey" PRIMARY KEY ("postcardId","userId")
);

-- CreateTable
CREATE TABLE "postcard_comments" (
    "id" UUID NOT NULL,
    "postcardId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "parentId" UUID,
    "content" TEXT NOT NULL,
    "status" "PostcardCommentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(3),
    "edited_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "postcard_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_comment_reactions" (
    "commentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_comment_reactions_pkey" PRIMARY KEY ("commentId","userId","emoji")
);

-- CreateTable
CREATE TABLE "postcard_notifications" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "actorId" UUID,
    "postcardId" UUID,
    "commentId" UUID,
    "type" "PostcardNotificationType" NOT NULL,
    "reaction_emoji" VARCHAR(64),
    "read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_shares" (
    "id" UUID NOT NULL,
    "postcardId" UUID NOT NULL,
    "userId" UUID,
    "channel" VARCHAR(50),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_reports" (
    "id" UUID NOT NULL,
    "postcardId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "PostcardReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(3),

    CONSTRAINT "postcard_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_moderations" (
    "id" UUID NOT NULL,
    "postcardId" UUID NOT NULL,
    "moderatorId" UUID NOT NULL,
    "action" "PostcardModerationAction" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_moderations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_user_restrictions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "PostcardRestrictionType" NOT NULL,
    "reason" TEXT,
    "starts_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_user_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_generations" (
    "id" UUID NOT NULL,
    "postcardId" UUID,
    "userId" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "type" "PostcardType" NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "prompt_version" VARCHAR(100) NOT NULL,
    "input_summary" TEXT,
    "output_content" TEXT,
    "status" "PostcardGenerationStatus" NOT NULL DEFAULT 'REQUESTED',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "postcard_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_policies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "daily_create_limit" INTEGER NOT NULL,
    "movie_daily_limit" INTEGER NOT NULL,
    "ai_daily_limit" INTEGER NOT NULL,
    "max_content_length" INTEGER NOT NULL,
    "comment_max_length" INTEGER NOT NULL,
    "comment_rate_limit_count" INTEGER NOT NULL,
    "comment_rate_limit_window_sec" INTEGER NOT NULL,
    "duplicate_comment_window_sec" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "postcard_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postcard_daily_usages" (
    "userId" UUID NOT NULL,
    "movieId" UUID NOT NULL,
    "usageDate" DATE NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "ai_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "postcard_daily_usages_pkey" PRIMARY KEY ("userId","movieId","usageDate")
);

-- CreateIndex
CREATE INDEX "postcards_userId_status_created_at_idx" ON "postcards"("userId", "status", "created_at");

-- CreateIndex
CREATE INDEX "postcards_movieId_visibility_status_created_at_idx" ON "postcards"("movieId", "visibility", "status", "created_at");

-- CreateIndex
CREATE INDEX "postcards_visibility_status_published_at_idx" ON "postcards"("visibility", "status", "published_at");

-- CreateIndex
CREATE INDEX "postcard_revisions_postcardId_created_at_idx" ON "postcard_revisions"("postcardId", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "postcard_revisions_postcardId_version_key" ON "postcard_revisions"("postcardId", "version");

-- CreateIndex
CREATE INDEX "postcard_reactions_postcardId_emoji_created_at_idx" ON "postcard_reactions"("postcardId", "emoji", "created_at");

-- CreateIndex
CREATE INDEX "postcard_reactions_userId_created_at_idx" ON "postcard_reactions"("userId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_bookmarks_userId_created_at_idx" ON "postcard_bookmarks"("userId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_comments_postcardId_status_created_at_idx" ON "postcard_comments"("postcardId", "status", "created_at");

-- CreateIndex
CREATE INDEX "postcard_comments_postcardId_parentId_status_created_at_idx" ON "postcard_comments"("postcardId", "parentId", "status", "created_at");

-- CreateIndex
CREATE INDEX "postcard_comments_postcardId_userId_created_at_idx" ON "postcard_comments"("postcardId", "userId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_comment_reactions_commentId_emoji_created_at_idx" ON "postcard_comment_reactions"("commentId", "emoji", "created_at");

-- CreateIndex
CREATE INDEX "postcard_comment_reactions_userId_created_at_idx" ON "postcard_comment_reactions"("userId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_notifications_recipientId_read_at_created_at_idx" ON "postcard_notifications"("recipientId", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "postcard_notifications_postcardId_created_at_idx" ON "postcard_notifications"("postcardId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_shares_postcardId_created_at_idx" ON "postcard_shares"("postcardId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_shares_userId_created_at_idx" ON "postcard_shares"("userId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_reports_postcardId_status_created_at_idx" ON "postcard_reports"("postcardId", "status", "created_at");

-- CreateIndex
CREATE INDEX "postcard_reports_reporterId_created_at_idx" ON "postcard_reports"("reporterId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_moderations_postcardId_created_at_idx" ON "postcard_moderations"("postcardId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_moderations_moderatorId_created_at_idx" ON "postcard_moderations"("moderatorId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_user_restrictions_userId_type_revoked_at_expires_a_idx" ON "postcard_user_restrictions"("userId", "type", "revoked_at", "expires_at");

-- CreateIndex
CREATE INDEX "postcard_user_restrictions_created_at_idx" ON "postcard_user_restrictions"("created_at");

-- CreateIndex
CREATE INDEX "postcard_generations_userId_created_at_idx" ON "postcard_generations"("userId", "created_at");

-- CreateIndex
CREATE INDEX "postcard_generations_movieId_status_created_at_idx" ON "postcard_generations"("movieId", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "postcard_policies_name_key" ON "postcard_policies"("name");

-- CreateIndex
CREATE INDEX "postcard_daily_usages_userId_usageDate_idx" ON "postcard_daily_usages"("userId", "usageDate");

-- AddForeignKey
ALTER TABLE "postcards" ADD CONSTRAINT "postcards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcards" ADD CONSTRAINT "postcards_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_revisions" ADD CONSTRAINT "postcard_revisions_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_revisions" ADD CONSTRAINT "postcard_revisions_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_reactions" ADD CONSTRAINT "postcard_reactions_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_reactions" ADD CONSTRAINT "postcard_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_bookmarks" ADD CONSTRAINT "postcard_bookmarks_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_bookmarks" ADD CONSTRAINT "postcard_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_comments" ADD CONSTRAINT "postcard_comments_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_comments" ADD CONSTRAINT "postcard_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_comments" ADD CONSTRAINT "postcard_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "postcard_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_comment_reactions" ADD CONSTRAINT "postcard_comment_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "postcard_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_comment_reactions" ADD CONSTRAINT "postcard_comment_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_notifications" ADD CONSTRAINT "postcard_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_notifications" ADD CONSTRAINT "postcard_notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_notifications" ADD CONSTRAINT "postcard_notifications_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_notifications" ADD CONSTRAINT "postcard_notifications_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "postcard_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_shares" ADD CONSTRAINT "postcard_shares_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_shares" ADD CONSTRAINT "postcard_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_reports" ADD CONSTRAINT "postcard_reports_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_reports" ADD CONSTRAINT "postcard_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_moderations" ADD CONSTRAINT "postcard_moderations_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_moderations" ADD CONSTRAINT "postcard_moderations_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_user_restrictions" ADD CONSTRAINT "postcard_user_restrictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_generations" ADD CONSTRAINT "postcard_generations_postcardId_fkey" FOREIGN KEY ("postcardId") REFERENCES "postcards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_generations" ADD CONSTRAINT "postcard_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_generations" ADD CONSTRAINT "postcard_generations_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_daily_usages" ADD CONSTRAINT "postcard_daily_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard_daily_usages" ADD CONSTRAINT "postcard_daily_usages_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
