"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { tasks as defaultTasks } from "@/lib/data"
import { GripVertical } from "lucide-react"
import type { Task } from "@/lib/types"

interface ActivitiesKanbanProps {
  tasks?: Task[]
}

export function ActivitiesKanban({ tasks = defaultTasks }: ActivitiesKanbanProps) {
  const todoTasks = tasks.filter((t) => t.status === "todo")
  const doingTasks = tasks.filter((t) => t.status === "doing")
  const doneTasks = tasks.filter((t) => t.status === "done")

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Task Board</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaskColumn title="To-do" tasks={todoTasks} bgColor="bg-rose-100" />
        <TaskColumn title="Doing" tasks={doingTasks} bgColor="bg-amber-50" />
        <TaskColumn title="Done" tasks={doneTasks} bgColor="bg-green-100" />
      </div>
    </div>
  )
}

interface TaskColumnProps {
  title: string
  tasks: Task[]
  bgColor: string
}

function TaskColumn({ title, tasks, bgColor }: TaskColumnProps) {
  return (
    <div className={`${bgColor} rounded-lg p-4 min-h-[300px] lg:min-h-[500px]`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task: Task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start gap-2">
              <GripVertical className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                )}
                {task.deadline && (
                  <p className="text-xs text-gray-500 mb-2">
                    Due: {new Date(task.deadline).toLocaleDateString("en-US", { 
                      month: "short", 
                      day: "numeric", 
                      year: "numeric" 
                    })}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={task.assigneeAvatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {task.assignee
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-500 truncate">{task.assignee}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
