/*
  Warnings:

  - Added the required column `houseId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "houseId" UUID NOT NULL;

-- DropEnum
DROP TYPE "public"."Unit";

-- CreateIndex
CREATE INDEX "Task_houseId_idx" ON "Task"("houseId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
