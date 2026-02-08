-- CreateTable
CREATE TABLE "TaskCreationLog" (
    "id" SERIAL NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "accessTokenId" INTEGER NOT NULL,
    "totalTasks" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "failureCount" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "errorSummary" TEXT,
    "taskResults" JSONB,

    CONSTRAINT "TaskCreationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskCreationLog_enterpriseId_idx" ON "TaskCreationLog"("enterpriseId");

-- CreateIndex
CREATE INDEX "TaskCreationLog_status_idx" ON "TaskCreationLog"("status");
