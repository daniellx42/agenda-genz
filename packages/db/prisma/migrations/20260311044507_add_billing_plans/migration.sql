-- CreateEnum
CREATE TYPE "BillingPlanInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "BillingPaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "planExpiresAt" TIMESTAMP(3),
ADD COLUMN     "trialStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "billing_plan" (
    "id" TEXT NOT NULL,
    "interval" "BillingPlanInterval" NOT NULL,
    "name" TEXT NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "discountLabel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "mpPaymentId" TEXT,
    "mpIdempotencyKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "status" "BillingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "pixQrCode" TEXT,
    "pixQrCodeBase64" TEXT,
    "pixExpiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_plan_interval_key" ON "billing_plan"("interval");

-- CreateIndex
CREATE UNIQUE INDEX "billing_payment_mpPaymentId_key" ON "billing_payment"("mpPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_payment_mpIdempotencyKey_key" ON "billing_payment"("mpIdempotencyKey");

-- CreateIndex
CREATE INDEX "billing_payment_userId_idx" ON "billing_payment"("userId");

-- CreateIndex
CREATE INDEX "billing_payment_userId_status_idx" ON "billing_payment"("userId", "status");

-- AddForeignKey
ALTER TABLE "billing_payment" ADD CONSTRAINT "billing_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_payment" ADD CONSTRAINT "billing_payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "billing_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
