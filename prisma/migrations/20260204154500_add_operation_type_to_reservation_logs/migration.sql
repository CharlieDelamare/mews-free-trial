-- AlterTable
ALTER TABLE "ReservationCreationLog" ADD COLUMN "operationType" TEXT DEFAULT 'automatic';

-- CreateIndex
CREATE INDEX "ReservationCreationLog_operationType_idx" ON "ReservationCreationLog"("operationType");
