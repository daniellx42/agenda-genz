-- CreateEnum
CREATE TYPE "ReferralUseStatus" AS ENUM ('DISMISSED', 'APPLIED');

-- CreateEnum
CREATE TYPE "ReferralWithdrawalStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "referral_code" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_use" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT,
    "invitedUserId" TEXT,
    "status" "ReferralUseStatus" NOT NULL,
    "code" TEXT,
    "appliedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "invitedRewardGrantedAt" TIMESTAMP(3),
    "ownerRewardGrantedAt" TIMESTAMP(3),
    "ownerRewardSourcePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_use_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_withdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "amountInCents" INTEGER NOT NULL,
    "pixKey" TEXT NOT NULL,
    "status" "ReferralWithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "referral_withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_code_userId_key" ON "referral_code"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_code_code_key" ON "referral_code"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referral_use_invitedUserId_key" ON "referral_use"("invitedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_use_ownerRewardSourcePaymentId_key" ON "referral_use"("ownerRewardSourcePaymentId");

-- CreateIndex
CREATE INDEX "referral_use_referralCodeId_idx" ON "referral_use"("referralCodeId");

-- CreateIndex
CREATE INDEX "referral_use_status_idx" ON "referral_use"("status");

-- CreateIndex
CREATE INDEX "referral_withdrawal_userId_idx" ON "referral_withdrawal"("userId");

-- CreateIndex
CREATE INDEX "referral_withdrawal_userId_status_idx" ON "referral_withdrawal"("userId", "status");

-- AddForeignKey
ALTER TABLE "referral_code" ADD CONSTRAINT "referral_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_use" ADD CONSTRAINT "referral_use_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "referral_code"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_use" ADD CONSTRAINT "referral_use_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_withdrawal" ADD CONSTRAINT "referral_withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
