-- AlterTable
ALTER TABLE "EnvironmentLog" ADD COLUMN     "salesforceAccountId" TEXT;

-- CreateIndex
CREATE INDEX "EnvironmentLog_salesforceAccountId_idx" ON "EnvironmentLog"("salesforceAccountId");
