/*
  Warnings:

  - Added the required column `createdByUser` to the `PantryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `houseId` to the `PantryItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PantryItem" ADD COLUMN     "createdByUser" UUID NOT NULL,
ADD COLUMN     "houseId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_createdByUser_fkey" FOREIGN KEY ("createdByUser") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
