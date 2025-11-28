-- AlterTable
ALTER TABLE "NotificationToUser" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "NotificationToUser_userId_deletedAt_idx" ON "NotificationToUser"("userId", "deletedAt");
