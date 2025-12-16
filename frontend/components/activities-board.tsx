"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHouse } from "@/lib/house-context";
import { getTasks } from "@/lib/tasks-service";
import type { Task } from "@/lib/types";

export function ActivitiesBoard() {
  const { selectedHouse } = useHouse();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [selectedHouse]);

  const loadTasks = async () => {
    if (!selectedHouse) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(
        "[ActivitiesBoard] Fetching tasks for house:",
        selectedHouse.id,
      );
      const fetchedTasks = await getTasks({
        houseId: selectedHouse.id,
        archived: "false",
      });
      console.log("[ActivitiesBoard] Fetched tasks:", fetchedTasks);
      console.log(
        "[ActivitiesBoard] Task house IDs:",
        fetchedTasks.map((t) => ({
          title: t.title,
          houseId: t.houseId,
          houseName: t.houseName,
        })),
      );
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doingTasks = tasks.filter((t) => t.status === "doing");
  const doneTasks = tasks.filter((t) => t.status === "done");

  if (isLoading) {
    return (
      <div>
        <h2 className="text-sm font-medium text-gray-600 mb-4">Activities</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-rose-100 rounded-lg p-4 min-h-[300px] lg:min-h-[500px]">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">To-do</h3>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 min-h-[300px] lg:min-h-[500px]">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Doing</h3>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
          <div className="bg-green-100 rounded-lg p-4 min-h-[300px] lg:min-h-[500px]">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Done</h3>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-600 mb-4">Activities</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaskColumn title="To-do" tasks={todoTasks} color="rose" />
        <TaskColumn title="Doing" tasks={doingTasks} color="amber" />
        <TaskColumn title="Done" tasks={doneTasks} color="green" />
      </div>
    </div>
  );
}

function TaskColumn({
  title,
  tasks,
  color,
}: {
  title: string;
  tasks: Task[];
  color: "rose" | "amber" | "green";
}) {
  const bgColor = {
    rose: "bg-rose-100",
    amber: "bg-amber-50",
    green: "bg-green-100",
  }[color];

  return (
    <div className={`${bgColor} rounded-lg p-4 min-h-[300px] lg:min-h-[500px]`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg p-3 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500">{task.assignee}</p>
                </div>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={task.assigneeAvatar} />
                  <AvatarFallback>
                    {(task.assignee || "Unassigned")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
