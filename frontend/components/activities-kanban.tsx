"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { tasks as defaultTasks } from "@/lib/data"
import { GripVertical, Pencil, Trash2, ArchiveRestore } from "lucide-react"
import { archiveTask } from "@/lib/tasks-service"
import { toast } from "@/hooks/use-toast"
import type { Task } from "@/lib/types"

interface ActivitiesKanbanProps {
  tasks?: Task[]
  onEditTask?: (task: Task) => void
  onDeleteTask?: (task: Task) => void
  onChangeStatus?: (taskId: string, status: 'todo' | 'doing' | 'done') => void
  onTaskArchived?: (taskId: string) => void
}

export function ActivitiesKanban({ tasks = defaultTasks, onEditTask, onDeleteTask, onChangeStatus, onTaskArchived }: ActivitiesKanbanProps) {
  const todoTasks = tasks.filter((t) => t.status === "todo")
  const doingTasks = tasks.filter((t) => t.status === "doing")
  const doneTasks = tasks.filter((t) => t.status === "done")

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Task Board</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaskColumn title="To-do" tasks={todoTasks} bgColor="bg-rose-100" status="todo" onEditTask={onEditTask} onDeleteTask={onDeleteTask} onChangeStatus={onChangeStatus} />
        <TaskColumn title="Doing" tasks={doingTasks} bgColor="bg-amber-50" status="doing" onEditTask={onEditTask} onDeleteTask={onDeleteTask} onChangeStatus={onChangeStatus} />
        <TaskColumn title="Done" tasks={doneTasks} bgColor="bg-green-100" status="done" onEditTask={onEditTask} onDeleteTask={onDeleteTask} onChangeStatus={onChangeStatus} />
      </div>
    </div>
  )
}

interface TaskColumnProps {
  title: string
  tasks: Task[]
  bgColor: string
  status?: 'todo' | 'doing' | 'done'
  onEditTask?: (task: Task) => void
  onDeleteTask?: (task: Task) => void
  onChangeStatus?: (taskId: string, status: 'todo' | 'doing' | 'done') => void
}

function TaskColumn({ title, tasks, bgColor, onEditTask, onDeleteTask, status, onChangeStatus }: TaskColumnProps & { onTaskArchived?: (taskId: string) => void }) {
  const handleDragOver = (e: any) => {
    e.preventDefault()
  }

  const handleDrop = (e: any) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    if (onChangeStatus && status) onChangeStatus(id, status)
  }

  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop} className={`${bgColor} rounded-lg p-4 min-h-[300px] lg:min-h-[500px]`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task: Task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', task.id)
            }}
            className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
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
                <div className="flex items-center justify-between">
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTask?.(task)
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex items-center gap-1 h-7 px-2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteTask?.(task)
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </Button>
                    {status === 'done' && !task.archived && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex items-center gap-1 h-7 px-2 cursor-pointer"
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const archived = await archiveTask(task.id)
                            // remove from UI optimistically by changing status to done (already) & mark archived
                            onChangeStatus?.(archived.id, archived.status)
                            toast({ title: 'Task archived', description: 'Moved to history.' })
                          } catch (err) {
                            toast({ title: 'Archive failed', description: String((err as any)?.message || 'Could not archive') })
                          }
                        }}
                      >
                        <ArchiveRestore className="w-3.5 h-3.5 text-gray-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
