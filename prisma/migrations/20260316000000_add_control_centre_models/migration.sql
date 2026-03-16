-- CreateTable
CREATE TABLE "ControlCentreLog" (
    "id" TEXT NOT NULL,
    "logType" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "totalItems" INTEGER,
    "successCount" INTEGER,
    "failureCount" INTEGER,
    "operationDetails" JSONB,

    CONSTRAINT "ControlCentreLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IbeSession" (
    "id" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "reservationId" TEXT,
    "checkIn" TEXT NOT NULL,
    "checkOut" TEXT NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "IbeSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ControlCentreLog_enterpriseId_idx" ON "ControlCentreLog"("enterpriseId");

-- CreateIndex
CREATE INDEX "ControlCentreLog_status_idx" ON "ControlCentreLog"("status");

-- CreateIndex
CREATE INDEX "ControlCentreLog_logType_idx" ON "ControlCentreLog"("logType");

-- CreateIndex
CREATE INDEX "ControlCentreLog_timestamp_idx" ON "ControlCentreLog"("timestamp");

-- CreateIndex
CREATE INDEX "IbeSession_enterpriseId_idx" ON "IbeSession"("enterpriseId");

-- CreateIndex
CREATE INDEX "IbeSession_theme_idx" ON "IbeSession"("theme");

-- CreateIndex
CREATE INDEX "IbeSession_createdAt_idx" ON "IbeSession"("createdAt");
