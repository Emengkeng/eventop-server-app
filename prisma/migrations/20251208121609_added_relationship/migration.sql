-- CreateIndex
CREATE INDEX "checkout_sessions_plan_pda_idx" ON "checkout_sessions"("plan_pda");

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_merchant_wallet_fkey" FOREIGN KEY ("merchant_wallet") REFERENCES "merchants"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_plan_pda_fkey" FOREIGN KEY ("plan_pda") REFERENCES "merchant_plans"("plan_pda") ON DELETE RESTRICT ON UPDATE CASCADE;
