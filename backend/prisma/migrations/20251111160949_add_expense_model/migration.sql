-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('GROCERIES', 'UTILITIES', 'HOUSEHOLD', 'FOOD', 'ENTERTAINMENT', 'TRANSPORTATION', 'OTHER');

-- DropEnum
DROP TYPE "public"."Unit";

-- CreateTable
CREATE TABLE "Expense" (
    "id" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidById" UUID NOT NULL,
    "houseId" UUID NOT NULL,
    "splitWith" UUID[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_houseId_idx" ON "Expense"("houseId");

-- CreateIndex
CREATE INDEX "Expense_paidById_idx" ON "Expense"("paidById");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
