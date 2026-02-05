-- CreateTable
CREATE TABLE "UnifiedLog" (
    "id" TEXT NOT NULL,
    "logType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enterpriseId" TEXT,
    "status" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "propertyName" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "propertyCountry" TEXT,
    "propertyType" TEXT,
    "loginUrl" TEXT,
    "loginEmail" TEXT,
    "loginPassword" TEXT,
    "requestorEmail" TEXT,
    "durationDays" INTEGER,
    "roomCount" INTEGER,
    "dormCount" INTEGER,
    "apartmentCount" INTEGER,
    "bedCount" INTEGER,
    "timezone" TEXT,
    "salesforceAccountId" TEXT,
    "currentStep" INTEGER,
    "totalSteps" INTEGER,
    "accessTokenId" INTEGER,
    "totalItems" INTEGER,
    "successCount" INTEGER,
    "failureCount" INTEGER,
    "operationDetails" JSONB,

    CONSTRAINT "UnifiedLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnifiedLog_timestamp_idx" ON "UnifiedLog"("timestamp");

-- CreateIndex
CREATE INDEX "UnifiedLog_logType_idx" ON "UnifiedLog"("logType");

-- CreateIndex
CREATE INDEX "UnifiedLog_enterpriseId_idx" ON "UnifiedLog"("enterpriseId");

-- CreateIndex
CREATE INDEX "UnifiedLog_status_idx" ON "UnifiedLog"("status");

-- CreateIndex
CREATE INDEX "UnifiedLog_logType_timestamp_idx" ON "UnifiedLog"("logType", "timestamp");
