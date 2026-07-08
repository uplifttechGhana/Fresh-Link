-- DropForeignKey
ALTER TABLE "transport_jobs" DROP CONSTRAINT "transport_jobs_transporterId_fkey";

-- AlterTable
ALTER TABLE "transport_jobs" ALTER COLUMN "transporterId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "transport_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
