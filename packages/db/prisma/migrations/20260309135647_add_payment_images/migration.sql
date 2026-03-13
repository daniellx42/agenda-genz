-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "appointment" ADD COLUMN     "afterImageKey" TEXT,
ADD COLUMN     "beforeImageKey" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "client" ADD COLUMN     "profileImageKey" TEXT;
