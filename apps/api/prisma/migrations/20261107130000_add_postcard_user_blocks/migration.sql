CREATE TABLE "postcard_user_blocks" (
  "blockerId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "blockedId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("blockerId", "blockedId"),
  CHECK ("blockerId" <> "blockedId")
);

CREATE INDEX "postcard_user_blocks_blockedId_blockerId_idx"
ON "postcard_user_blocks"("blockedId", "blockerId");
