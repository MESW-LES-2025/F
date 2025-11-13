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

export default function ActivitiesPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async (background = false) => {
    try {
      if (!background) {
        setIsLoading(true)
        setError(null)
      }

      const fetchedTasks = await getTasks()
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

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading tasks...</p>
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
      <ActivitiesHeader onTaskCreated={handleTaskCreated} />
  <ActivitiesStats tasks={tasks} />
      <ActivitiesKanban 
        tasks={tasks} 
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onChangeStatus={handleStatusChange}
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
