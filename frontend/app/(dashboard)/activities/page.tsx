"use client"

import { useState, useEffect } from "react"
import { ActivitiesHeader } from "@/components/activities-header"
import { ActivitiesStats } from "@/components/activities-stats"
import { ActivitiesKanban } from "@/components/activities-kanban"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"
import { getTasks, updateTask } from "@/lib/tasks-service"
import { toast } from "@/hooks/use-toast"
import type { Task } from "@/lib/types"
import { useHouse } from "@/lib/house-context"

export default function ActivitiesPage() {
  const { selectedHouse } = useHouse()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  // Filters
  const [timeframe, setTimeframe] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Load tasks when selectedHouse changes
  useEffect(() => {
    loadTasks()
  }, [selectedHouse])

  const loadTasks = async (background = false) => {
    try {
      if (!background) {
        setIsLoading(true)
        setError(null)
      
      // Only fetch tasks if a house is selected
      if (!selectedHouse) {
        setTasks([])
        setIsLoading(false)
        return
      }
      
      }

  // only non-archived tasks
  const fetchedTasks = await getTasks({ archived: 'false', houseId: selectedHouse.id })
      setTasks(fetchedTasks)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      if (!background) {
        setError('Failed to load tasks. Please try again.')
      }
    } finally {
      if (!background) setIsLoading(false)
    }
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask])
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    )
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  const handleTaskArchived = (taskId: string) => {
    // Remove archived task from the board
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  const handleStatusChange = async (taskId: string, status: 'todo' | 'doing' | 'done') => {
    const prev = tasks
    // optimistic UI
    setTasks((prevTasks) => prevTasks.map((t) => (t.id === taskId ? { ...t, status } : t)))

    try {
      const updated = await updateTask(taskId, { status })
      setTasks((prevTasks) => prevTasks.map((t) => (t.id === updated.id ? updated : t)))
      toast({ title: 'Task updated', description: 'Status updated.' })
    } catch (err) {
      setTasks(prev)
      toast({ title: 'Update failed', description: String((err as any)?.message || 'Could not update task') })
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task)
  }

  const assignees = Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean)))

  const inTimeframe = (deadline: any, tf: string) => {
    if (tf === "all") return true
    if (!deadline) return false
    const d = new Date(deadline)
    const now = new Date()

    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

    if (tf === "today") {
      return sameDay(d, now)
    }

    if (tf === "this-week") {
      // week starting Monday
      const day = now.getDay() || 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - (day - 1))
      monday.setHours(0, 0, 0, 0)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)
      return d >= monday && d <= sunday
    }

    if (tf === "this-month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }

    return true
  }

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false
    if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false
    if (!inTimeframe(t.deadline, timeframe)) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <ActivitiesHeader onTaskCreated={handleTaskCreated} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (!selectedHouse) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <ActivitiesHeader onTaskCreated={handleTaskCreated} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No house selected</p>
            <p className="text-sm text-gray-400">Please select a house to view tasks</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => loadTasks(false)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <ActivitiesHeader
        onTaskCreated={handleTaskCreated}
        timeframe={timeframe}
        assignee={assigneeFilter}
        status={statusFilter}
        assignees={assignees}
        onTimeframeChange={(v) => setTimeframe(v)}
        onAssigneeChange={(v) => setAssigneeFilter(v)}
        onStatusChange={(v) => setStatusFilter(v)}
      />
      <ActivitiesStats tasks={filteredTasks} />

      <ActivitiesKanban 
        tasks={filteredTasks} 
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onChangeStatus={handleStatusChange}
        onTaskArchived={handleTaskArchived}
      />

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Delete Task Dialog */}
      <DeleteTaskDialog
        task={deletingTask}
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  )
}
