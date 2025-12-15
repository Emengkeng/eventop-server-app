/*
  Warnings:

  - Added the required column `session_token` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/

-- Delete existing test subscriptions
DELETE FROM "subscriptions";

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "session_token" TEXT NOT NULL;

-- Make customerEmail required
ALTER TABLE "subscriptions" ALTER COLUMN "customer_email" SET NOT NULL;

-- CreateIndex
CREATE INDEX "subscriptions_session_token_idx" ON "subscriptions"("session_token");