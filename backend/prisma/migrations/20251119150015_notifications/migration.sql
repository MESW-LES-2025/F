-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('HOUSE', 'PANTRY', 'EXPENSES', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "category" "NotificationCategory",
    "level" "NotificationLevel",
    "title" TEXT NOT NULL,
    "body" TEXT,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationToUser" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "notificationId" UUID NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationToUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationToUser_userId_isRead_idx" ON "NotificationToUser"("userId", "isRead");

-- CreateIndex
CREATE INDEX "NotificationToUser_notificationId_idx" ON "NotificationToUser"("notificationId");

-- AddForeignKey
ALTER TABLE "NotificationToUser" ADD CONSTRAINT "NotificationToUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationToUser" ADD CONSTRAINT "NotificationToUser_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
