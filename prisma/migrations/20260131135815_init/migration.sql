-- CreateTable
CREATE TABLE "EnvironmentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "propertyCountry" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "loginUrl" TEXT NOT NULL,
    "loginEmail" TEXT NOT NULL,
    "loginPassword" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT
);

-- CreateIndex
CREATE INDEX "EnvironmentLog_timestamp_idx" ON "EnvironmentLog"("timestamp");

-- CreateIndex
CREATE INDEX "EnvironmentLog_status_idx" ON "EnvironmentLog"("status");
