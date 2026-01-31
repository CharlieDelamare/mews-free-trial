-- CreateTable
CREATE TABLE "AccessToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "enterpriseName" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT,
    "integrationId" TEXT,
    "integrationName" TEXT,
    "createdUtc" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "action" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "AccessToken_enterpriseId_idx" ON "AccessToken"("enterpriseId");
