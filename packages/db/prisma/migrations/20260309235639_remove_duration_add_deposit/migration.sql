/*
  Warnings:

  - You are about to drop the column `duration` on the `service` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'DEPOSIT_PAID';

-- AlterTable
ALTER TABLE "service" DROP COLUMN "duration",
ADD COLUMN     "depositPercentage" INTEGER;
