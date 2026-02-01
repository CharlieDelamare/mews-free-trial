-- AlterTable
ALTER TABLE "EnvironmentLog" ADD COLUMN "enterpriseId" TEXT,
ADD COLUMN "requestorEmail" TEXT;

-- CreateIndex
CREATE INDEX "EnvironmentLog_enterpriseId_idx" ON "EnvironmentLog"("enterpriseId");
