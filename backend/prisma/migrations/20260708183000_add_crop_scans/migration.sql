-- CreateEnum
CREATE TYPE "CropHealthStatus" AS ENUM ('healthy', 'possible_disease', 'possible_pest', 'unclear');

-- CreateTable
CREATE TABLE "crop_scans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "crop" TEXT,
    "confidence" DOUBLE PRECISION,
    "healthStatus" "CropHealthStatus",
    "diseasesJson" JSONB,
    "advice" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crop_scans_userId_createdAt_idx" ON "crop_scans"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "crop_scans" ADD CONSTRAINT "crop_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
