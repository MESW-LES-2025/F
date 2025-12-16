"use client";

import { useEffect, useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getExpenses } from "@/lib/expense-service";
import type { Expense } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExpensesListProps {
  houseId?: string;
  refreshTrigger?: number;
  // Filter and sort from parent
  sortField: "date" | "amount" | "payer";
  sortOrder: "asc" | "desc";
  filterCategory: string;
  filterDateFrom: string;
  filterDateTo: string;
  compact?: boolean;
  limit?: number;
}

export function ExpensesList({
  houseId,
  refreshTrigger,
  sortField,
  sortOrder,
  filterCategory,
  filterDateFrom,
  filterDateTo,
  compact = false,
  limit,
}: ExpensesListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExpenses();
  }, [houseId, refreshTrigger]);

  const loadExpenses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getExpenses(houseId ? { houseId } : undefined);
      setExpenses(data);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      setError("Failed to load expenses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Compute filtered and sorted expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let result = [...expenses];

    // Filter by category
    if (filterCategory !== "all") {
      result = result.filter((e) => e.category === filterCategory);
    }

    // Filter by date range
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      result = result.filter((e) => new Date(e.date) >= fromDate);
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999); // include entire day
      result = result.filter((e) => new Date(e.date) <= toDate);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "payer":
          comparison = a.paidBy.localeCompare(b.paidBy);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Apply limit if specified
    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [
    expenses,
    sortField,
    sortOrder,
    filterCategory,
    filterDateFrom,
    filterDateTo,
    limit,
  ]);

  if (isLoading) {
    return (
      <div
        className={
          compact
            ? "p-4 flex items-center justify-center"
            : "bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center"
        }
      >
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={
          compact ? "p-2" : "bg-white rounded-lg border border-gray-200 p-4"
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div
        className={
          compact
            ? "p-4 text-center text-sm text-muted-foreground"
            : "bg-white rounded-lg border border-gray-200 p-8 text-center"
        }
      >
        <p className="text-gray-500">
          No expenses recorded yet. Add your first expense to get started!
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {filteredAndSortedExpenses.map((expense) => {
          const splitCount = expense.splitWith.length;

          return (
            <div
              key={expense.id}
              className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={expense.paidByAvatar} />
                  <AvatarFallback>
                    {expense.paidBy
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {expense.title}
                    </p>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {expense.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {expense.paidBy} • {format(expense.date, "MMM d")}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">
                  {expense.amount.toFixed(2)}€
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent Expenses
          </h2>
          <p className="text-xs text-gray-500">
            Showing {filteredAndSortedExpenses.length} of {expenses.length}{" "}
            expenses
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredAndSortedExpenses.map((expense) => {
          const splitCount = expense.splitWith.length;
          const perPersonAmount = expense.amount / splitCount;

          return (
            <div
              key={expense.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={expense.paidByAvatar} />
                    <AvatarFallback>
                      {expense.paidBy
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {expense.title}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {expense.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Paid by {expense.paidBy}</span>
                      <span>•</span>
                      <span>{format(expense.date, "MMM d, yyyy")}</span>
                      <span>•</span>
                      <span>Split {splitCount} ways</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {expense.amount.toFixed(2)}€
                  </p>
                  <p className="text-xs text-gray-500">
                    {perPersonAmount.toFixed(2)}€ per person
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
