-- CreateTable
CREATE TABLE "ExpenseSplit" (
    "id" UUID NOT NULL,
    "expenseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseSplit_expenseId_idx" ON "ExpenseSplit"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseSplit_userId_idx" ON "ExpenseSplit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSplit_expenseId_userId_key" ON "ExpenseSplit"("expenseId", "userId");

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing expenses to use ExpenseSplit with equal percentages
INSERT INTO "ExpenseSplit" ("id", "expenseId", "userId", "percentage", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    e.id,
    unnest(e."splitWith"),
    100.0 / CARDINALITY(e."splitWith"),
    NOW(),
    NOW()
FROM "Expense" e
WHERE CARDINALITY(e."splitWith") > 0;
