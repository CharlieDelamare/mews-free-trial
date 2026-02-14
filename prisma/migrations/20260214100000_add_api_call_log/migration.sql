-- CreateTable
CREATE TABLE "ApiCallLog" (
    "id" SERIAL NOT NULL,
    "unifiedLogId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "url" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "statusCode" INTEGER,
    "durationMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "requestBody" TEXT,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ApiCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiCallLog_unifiedLogId_idx" ON "ApiCallLog"("unifiedLogId");

-- CreateIndex
CREATE INDEX "ApiCallLog_unifiedLogId_group_idx" ON "ApiCallLog"("unifiedLogId", "group");

-- CreateIndex
CREATE INDEX "ApiCallLog_unifiedLogId_timestamp_idx" ON "ApiCallLog"("unifiedLogId", "timestamp");
