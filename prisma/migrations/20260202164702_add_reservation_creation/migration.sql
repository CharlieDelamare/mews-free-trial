-- AlterTable
ALTER TABLE "EnvironmentLog" ADD COLUMN "roomCount" INTEGER,
ADD COLUMN "dormCount" INTEGER,
ADD COLUMN "apartmentCount" INTEGER,
ADD COLUMN "bedCount" INTEGER,
ADD COLUMN "timezone" TEXT;

-- CreateTable
CREATE TABLE "ReservationCreationLog" (
    "id" SERIAL NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "accessTokenId" INTEGER NOT NULL,
    "totalReservations" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "failureCount" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "errorSummary" TEXT,
    "reservationResults" JSONB,

    CONSTRAINT "ReservationCreationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationCreationLog_enterpriseId_idx" ON "ReservationCreationLog"("enterpriseId");

-- CreateIndex
CREATE INDEX "ReservationCreationLog_status_idx" ON "ReservationCreationLog"("status");
