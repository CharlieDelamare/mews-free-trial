-- CreateTable
CREATE TABLE "AccessToken" (
    "id" SERIAL NOT NULL,
    "accessToken" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "enterpriseName" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT,
    "integrationId" TEXT,
    "integrationName" TEXT,
    "createdUtc" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "action" TEXT NOT NULL,

    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessToken_enterpriseId_idx" ON "AccessToken"("enterpriseId");
