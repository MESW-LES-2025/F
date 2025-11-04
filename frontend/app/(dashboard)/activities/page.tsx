"use client"

import { useState, useEffect } from "react"
import { ActivitiesHeader } from "@/components/activities-header"
import { ActivitiesStats } from "@/components/activities-stats"
import { ActivitiesKanban } from "@/components/activities-kanban"
import { getTasks } from "@/lib/tasks-service"
import type { Task } from "@/lib/types"

export default function ActivitiesPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedTasks = await getTasks()
      setTasks(fetchedTasks)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError('Failed to load tasks. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask])
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
              onClick={loadTasks}
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
      <ActivitiesStats />
      <ActivitiesKanban tasks={tasks} />
    </div>
  )
}
