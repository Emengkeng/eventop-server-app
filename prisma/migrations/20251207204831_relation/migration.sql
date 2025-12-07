-- CreateIndex
CREATE INDEX "subscriptions_merchant_plan_pda_idx" ON "subscriptions"("merchant_plan_pda");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_merchant_plan_pda_fkey" FOREIGN KEY ("merchant_plan_pda") REFERENCES "merchant_plans"("plan_pda") ON DELETE RESTRICT ON UPDATE CASCADE;
