-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastRecurrenceDate" TIMESTAMP(3),
ADD COLUMN     "nextRecurrenceDate" TIMESTAMP(3),
ADD COLUMN     "parentRecurringTaskId" UUID,
ADD COLUMN     "recurrenceInterval" INTEGER,
ADD COLUMN     "recurrencePattern" "RecurrencePattern";

-- CreateIndex
CREATE INDEX "Task_isRecurring_idx" ON "Task"("isRecurring");

-- CreateIndex
CREATE INDEX "Task_nextRecurrenceDate_idx" ON "Task"("nextRecurrenceDate");

-- CreateIndex
CREATE INDEX "Task_parentRecurringTaskId_idx" ON "Task"("parentRecurringTaskId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentRecurringTaskId_fkey" FOREIGN KEY ("parentRecurringTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
