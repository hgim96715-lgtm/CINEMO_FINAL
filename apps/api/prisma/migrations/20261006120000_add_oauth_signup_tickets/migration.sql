-- CreateTable
CREATE TABLE "oauth_signup_tickets" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "providerImageUrl" TEXT,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_signup_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_signup_tickets_tokenHash_key"
ON "oauth_signup_tickets"("tokenHash");

-- CreateIndex
CREATE INDEX "oauth_signup_tickets_provider_providerUserId_idx"
ON "oauth_signup_tickets"("provider", "providerUserId");

-- CreateIndex
CREATE INDEX "oauth_signup_tickets_expiresAt_idx"
ON "oauth_signup_tickets"("expiresAt");
