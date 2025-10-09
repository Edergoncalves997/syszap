-- AlterTable
ALTER TABLE "Companies" ADD COLUMN     "Cache_Fetched_Days" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "Retention_Days" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "Messages" ADD COLUMN     "Cache_Until" TIMESTAMP(3),
ADD COLUMN     "Fetched_From_WhatsApp" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Messages_Cache_Until_idx" ON "Messages"("Cache_Until");
