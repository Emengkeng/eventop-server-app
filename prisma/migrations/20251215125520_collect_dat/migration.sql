-- AlterTable
ALTER TABLE "checkout_sessions" ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3);
