"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useHouse } from "@/lib/house-context";
import { getTasks } from "@/lib/tasks-service";
import { getExpenses } from "@/lib/expense-service";
import type { Task, Expense } from "@/lib/types";

export function MetricsCards() {
  const { selectedHouse } = useHouse();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedHouse]);

  const loadData = async () => {
    if (!selectedHouse) {
      setTasks([]);
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [fetchedTasks, fetchedExpenses] = await Promise.all([
        getTasks({ houseId: selectedHouse.id }),
        getExpenses(selectedHouse.id),
      ]);
      setTasks(fetchedTasks);
      setExpenses(fetchedExpenses);
    } catch (err) {
      console.error("Failed to load metrics data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics from real data
  const tasksCompleted = tasks.filter((t) => t.status === "done").length;
  const pendingTasks = tasks.filter(
    (t) => t.status === "todo" || t.status === "doing",
  ).length;

  // Find top contributor (user with most completed tasks)
  const contributorCounts: Record<string, number> = {};
  tasks
    .filter((t) => t.status === "done")
    .forEach((t) => {
      contributorCounts[t.assignee] = (contributorCounts[t.assignee] || 0) + 1;
    });
  const topContributor =
    Object.entries(contributorCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "N/A";

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Find top spender
  const spenderAmounts: Record<string, number> = {};
  expenses.forEach((e) => {
    const paidBy = e.paidBy?.name || e.paidBy?.username || "Unknown";
    spenderAmounts[paidBy] = (spenderAmounts[paidBy] || 0) + e.amount;
  });
  const topSpender =
    Object.entries(spenderAmounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "N/A";

  // Find top expense category
  const categoryCounts: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });
  const topCategory =
    Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "N/A";

  const metrics = [
    {
      label: "Tasks Completed",
      value: isLoading ? "..." : String(tasksCompleted),
    },
    { label: "Pending Tasks", value: isLoading ? "..." : String(pendingTasks) },
    { label: "Top Contributor", value: isLoading ? "..." : topContributor },
    {
      label: "Total Expenses",
      value: isLoading ? "..." : `${totalExpenses.toFixed(2)}€`,
    },
    { label: "Top Spender", value: isLoading ? "..." : topSpender },
    { label: "Top Expense Category", value: isLoading ? "..." : topCategory },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="p-3 md:p-4 bg-white">
          <p className="text-xs text-gray-600 mb-1 md:mb-2">{metric.label}</p>
          <p className="text-lg md:text-xl font-bold text-gray-900 truncate">
            {metric.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
