-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "merchant_wallet" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "merchant_wallet" TEXT NOT NULL,
    "plan_pda" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_id" TEXT,
    "success_url" TEXT NOT NULL,
    "cancel_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subscription_pda" TEXT,
    "user_wallet" TEXT,
    "signature" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identities" (
    "wallet_address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "source" TEXT NOT NULL,
    "privy_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("wallet_address")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_merchant_wallet_idx" ON "api_keys"("merchant_wallet");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_sessions_session_id_key" ON "checkout_sessions"("session_id");

-- CreateIndex
CREATE INDEX "checkout_sessions_session_id_idx" ON "checkout_sessions"("session_id");

-- CreateIndex
CREATE INDEX "checkout_sessions_merchant_wallet_idx" ON "checkout_sessions"("merchant_wallet");

-- CreateIndex
CREATE INDEX "checkout_sessions_status_idx" ON "checkout_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_email_key" ON "user_identities"("email");

-- CreateIndex
CREATE INDEX "user_identities_email_idx" ON "user_identities"("email");
