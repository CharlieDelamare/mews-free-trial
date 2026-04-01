-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL,
    "propertyName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "enterpriseId" TEXT,
    "accessTokenId" INTEGER,
    "excelData" JSONB,
    "answers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingSession_status_idx" ON "OnboardingSession"("status");

-- CreateIndex
CREATE INDEX "OnboardingSession_enterpriseId_idx" ON "OnboardingSession"("enterpriseId");

-- CreateIndex
CREATE INDEX "OnboardingSession_createdAt_idx" ON "OnboardingSession"("createdAt");
