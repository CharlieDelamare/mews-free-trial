-- CreateTable
CREATE TABLE "CustomerCreationLog" (
    "id" SERIAL NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "accessTokenId" INTEGER NOT NULL,
    "totalCustomers" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "failureCount" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "errorSummary" TEXT,
    "customerResults" JSONB,

    CONSTRAINT "CustomerCreationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerCreationLog_enterpriseId_idx" ON "CustomerCreationLog"("enterpriseId");

-- CreateIndex
CREATE INDEX "CustomerCreationLog_status_idx" ON "CustomerCreationLog"("status");
