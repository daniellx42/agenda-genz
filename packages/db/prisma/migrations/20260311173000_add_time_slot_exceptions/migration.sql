-- CreateTable
CREATE TABLE "time_slot_exception" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slot_exception_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_slot_exception_userId_idx" ON "time_slot_exception"("userId");

-- CreateIndex
CREATE INDEX "time_slot_exception_userId_date_idx" ON "time_slot_exception"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "time_slot_exception_timeSlotId_date_key" ON "time_slot_exception"("timeSlotId", "date");

-- AddForeignKey
ALTER TABLE "time_slot_exception" ADD CONSTRAINT "time_slot_exception_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "time_slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
