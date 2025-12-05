-- CreateEnum
CREATE TYPE "TaskSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'XL');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "size" "TaskSize" NOT NULL DEFAULT 'MEDIUM';

-- CreateTable
CREATE TABLE "TaskToUser" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskToUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskToUser_taskId_idx" ON "TaskToUser"("taskId");

-- CreateIndex
CREATE INDEX "TaskToUser_userId_idx" ON "TaskToUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskToUser_taskId_userId_key" ON "TaskToUser"("taskId", "userId");

-- AddForeignKey
ALTER TABLE "TaskToUser" ADD CONSTRAINT "TaskToUser_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskToUser" ADD CONSTRAINT "TaskToUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
