/*
  Warnings:

  - A unique constraint covering the columns `[signature]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "transactions_signature_key" ON "transactions"("signature");
