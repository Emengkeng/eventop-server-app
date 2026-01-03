/*
  Warnings:

  - You are about to drop the column `yield_strategy` on the `subscription_wallets` table. All the data in the column will be lost.
  - You are about to drop the column `yield_vault` on the `subscription_wallets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subscription_wallets" DROP COLUMN "yield_strategy",
DROP COLUMN "yield_vault",
ADD COLUMN     "yield_shares" TEXT NOT NULL DEFAULT '0';
