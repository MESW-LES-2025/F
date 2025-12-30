"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getExpenses } from "@/lib/expense-service";
import type { Expense } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";

interface ExpensesStatsProps {
  houseId?: string;
  refreshTrigger?: number;
}

export function ExpensesStats({ houseId, refreshTrigger }: ExpensesStatsProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, [houseId, refreshTrigger]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await getExpenses(houseId ? { houseId } : undefined);
      setExpenses(data);
    } catch (err) {
      console.error("Failed to load expenses for stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="p-4 bg-white border border-gray-200 flex items-center justify-center"
          >
            <Spinner className="w-6 h-6" />
          </Card>
        ))}
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  const expensesByCategory = expenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCategory =
    Object.entries(expensesByCategory).length > 0
      ? Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0]
      : null;

  const expensesByPerson = expenses.reduce(
    (acc, exp) => {
      acc[exp.paidBy] = (acc[exp.paidBy] || 0) + exp.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topSpender =
    Object.entries(expensesByPerson).length > 0
      ? Object.entries(expensesByPerson).sort((a, b) => b[1] - a[1])[0]
      : null;

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
        <p className="text-2xl font-bold text-gray-900">
          {totalExpenses.toFixed(2)}€
        </p>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Average Expense</p>
        <p className="text-2xl font-bold text-gray-900">
          {avgExpense.toFixed(2)}€
        </p>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Top Category</p>
        <p className="text-2xl font-bold text-gray-900">
          {topCategory ? topCategory[0] : "-"}
        </p>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Top Spender</p>
        <p className="text-2xl font-bold text-gray-900">
          {topSpender ? topSpender[0] : "-"}
        </p>
      </Card>
    </div>
  );
}
