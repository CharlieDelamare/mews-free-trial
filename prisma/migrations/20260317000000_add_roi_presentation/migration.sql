-- CreateTable
CREATE TABLE "RoiPresentation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "salesforceAccountId" TEXT,
    "country" TEXT NOT NULL,
    "hotelType" TEXT NOT NULL,
    "numberOfRooms" INTEGER NOT NULL DEFAULT 0,
    "totalAnnualSavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "stateJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoiPresentation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoiPresentation_createdAt_idx" ON "RoiPresentation"("createdAt");

-- CreateIndex
CREATE INDEX "RoiPresentation_createdBy_idx" ON "RoiPresentation"("createdBy");
