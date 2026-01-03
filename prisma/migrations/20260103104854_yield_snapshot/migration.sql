-- CreateTable
CREATE TABLE "yield_history" (
    "id" TEXT NOT NULL,
    "wallet_pda" TEXT NOT NULL,
    "user_wallet" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shares_held" TEXT NOT NULL,
    "value_in_usdc" TEXT NOT NULL,
    "daily_earnings" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yield_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yield_vault_snapshots" (
    "id" TEXT NOT NULL,
    "vault_pda" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "total_shares" TEXT NOT NULL,
    "total_value" TEXT NOT NULL,
    "exchange_rate" TEXT NOT NULL,
    "apy" TEXT NOT NULL,
    "buffer_amount" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yield_vault_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "yield_history_wallet_pda_idx" ON "yield_history"("wallet_pda");

-- CreateIndex
CREATE INDEX "yield_history_date_idx" ON "yield_history"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "yield_history_wallet_pda_date_key" ON "yield_history"("wallet_pda", "date");

-- CreateIndex
CREATE INDEX "yield_vault_snapshots_timestamp_idx" ON "yield_vault_snapshots"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "yield_vault_snapshots_vault_pda_idx" ON "yield_vault_snapshots"("vault_pda");
