-- AlterTable
ALTER TABLE "PantryToItem" ADD COLUMN     "lastExpiryNotificationAt" TIMESTAMP(3),
ADD COLUMN     "lastLowStockNotificationAt" TIMESTAMP(3);
