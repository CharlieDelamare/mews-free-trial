-- CreateTable
CREATE TABLE "ResetOperationLog" (
    "id" SERIAL NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "accessTokenId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 7,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorSummary" TEXT,
    "operationDetails" JSONB,

    CONSTRAINT "ResetOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResetOperationLog_enterpriseId_idx" ON "ResetOperationLog"("enterpriseId");

-- CreateIndex
CREATE INDEX "ResetOperationLog_status_idx" ON "ResetOperationLog"("status");

-- CreateIndex
CREATE INDEX "ResetOperationLog_startedAt_idx" ON "ResetOperationLog"("startedAt");
