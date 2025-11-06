-- AlterTable
ALTER TABLE "PantryItem" ALTER COLUMN "imageLink" DROP NOT NULL;

-- DropEnum
DROP TYPE "public"."Unit";

-- CreateIndex
CREATE INDEX "PantryItem_createdByUser_idx" ON "PantryItem"("createdByUser");

-- CreateIndex
CREATE INDEX "PantryItem_houseId_idx" ON "PantryItem"("houseId");
