"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getTasks } from "@/lib/tasks-service";
import { CheckCircle2, Clock, ListTodo, Users } from "lucide-react";
import type { Task } from "@/lib/types";

export function ActivitiesStats({ tasks: tasksProp }: { tasks?: Task[] }) {
  const [tasks, setTasks] = useState<Task[] | null>(tasksProp ?? null);
  const [isLoading, setIsLoading] = useState(!tasksProp);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tasksProp) {
      setTasks(tasksProp);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const load = async (background = false) => {
      try {
        if (!background) setIsLoading(true);
        // only non-archived tasks
        const fetched = await getTasks({ archived: "false" });
        if (mounted) setTasks(fetched);
      } catch (err) {
        console.error("Failed to load tasks for stats", err);
        if (mounted && !background) setError("Unable to load statistics");
      } finally {
        if (mounted && !background) setIsLoading(false);
      }
    };
    load();
    const id = setInterval(() => {
      load(true);
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [tasksProp]);

  if (isLoading || !tasks) {
    // lightweight placeholder while loading
    return (
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card
            key={i}
            className="p-4 bg-white border border-gray-200 animate-pulse h-20"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  // Exclude archived tasks from stats
  const activeTasks = tasks.filter((t) => !t.archived);
  const total = activeTasks.length;
  const todoCount = activeTasks.filter((t) => t.status === "todo").length;
  const doingCount = activeTasks.filter((t) => t.status === "doing").length;
  const doneCount = activeTasks.filter((t) => t.status === "done").length;

  const now = new Date();
  // exclude completed tasks from overdue/due-soon counts
  // Use date-only comparisons (start/end of day) so a deadline set to "today" is not considered overdue
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  const startToday = startOfDay(now);
  const endInSevenDays = endOfDay(
    new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  );

  const overdueCount = activeTasks.filter((t) => {
    if (t.status === "done" || !t.deadline) return false;
    const dl = new Date(t.deadline);
    // overdue
    return dl < startToday;
  }).length;

  // due soon if deadline is in 1 week
  const dueSoonCount = activeTasks.filter((t) => {
    if (t.status !== "doing" || !t.deadline) return false;
    const dl = new Date(t.deadline);
    return dl >= startToday && dl <= endInSevenDays;
  }).length;

  const tasksByPerson = activeTasks.reduce(
    (acc, task) => {
      const name = task.assignee || "Unassigned";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topContributorEntry = Object.entries(tasksByPerson).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">To-do</p>
            <p className="text-2xl font-bold text-gray-900">{todoCount}</p>
            <p className="text-xs text-gray-500">of {total} total</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-gray-900">{doingCount}</p>
            <p className="text-xs text-gray-500">due soon: {dueSoonCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{doneCount}</p>
            <p className="text-xs text-gray-500">overdue: {overdueCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Top Contributor</p>
            <p className="text-lg font-bold text-gray-900 truncate">
              {topContributorEntry
                ? `${(topContributorEntry[0] || "").split(" ")[0]} (${topContributorEntry[1]})`
                : "-"}
            </p>
            <p className="text-xs text-gray-500">
              people: {Object.keys(tasksByPerson).length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
