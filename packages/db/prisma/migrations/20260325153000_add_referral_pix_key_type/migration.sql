-- CreateEnum
CREATE TYPE "ReferralPixKeyType" AS ENUM ('CPF', 'PHONE', 'EMAIL', 'RANDOM');

-- AlterTable
ALTER TABLE "referral_withdrawal"
ADD COLUMN "pixKeyType" "ReferralPixKeyType" NOT NULL DEFAULT 'EMAIL';

