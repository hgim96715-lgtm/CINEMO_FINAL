ALTER TABLE "postcard_reports" ADD COLUMN "commentId" UUID;

ALTER TABLE "postcard_reports"
ADD CONSTRAINT "postcard_reports_commentId_fkey"
FOREIGN KEY ("commentId") REFERENCES "postcard_comments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "postcard_reports_commentId_reporterId_status_idx"
ON "postcard_reports"("commentId", "reporterId", "status");
