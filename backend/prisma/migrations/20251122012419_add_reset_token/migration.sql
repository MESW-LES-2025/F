-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" VARCHAR(500),
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
