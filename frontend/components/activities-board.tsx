import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Task {
  title: string
  assignee: string
  avatar: string
}

export function ActivitiesBoard() {
  const todoTasks: Task[] = [
    { title: "Clean the Kitchen", assignee: "João Félix", avatar: "/joao-felix.jpg" },
    { title: "Grocery Shopping", assignee: "Marcos Salgado", avatar: "/marcos-salgado.jpg" },
  ]

  const doingTasks: Task[] = [
    { title: "Clean the bathroom", assignee: "Marcos Salgado", avatar: "/marcos-salgado.jpg" },
  ]

  const doneTasks: Task[] = [
    { title: "Wash the dishes", assignee: "Marcos Salgado", avatar: "/marcos-salgado.jpg" },
    { title: "Take out the trash", assignee: "Joana Maria", avatar: "/joana-maria.jpg" },
    { title: "Clean the Living Room", assignee: "Joana Maria", avatar: "/joana-maria.jpg" },
  ]

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-600 mb-4">Activities</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaskColumn title="To-do" tasks={todoTasks} color="rose" />
        <TaskColumn title="Doing" tasks={doingTasks} color="amber" />
        <TaskColumn title="Done" tasks={doneTasks} color="green" />
      </div>
    </div>
  )
}

function TaskColumn({ title, tasks, color }: { title: string; tasks: Task[]; color: "rose" | "amber" | "green" }) {
  const bgColor = {
    rose: "bg-rose-100",
    amber: "bg-amber-50",
    green: "bg-green-100",
  }[color]

  return (
    <div className={`${bgColor} rounded-lg p-4 min-h-[300px] lg:min-h-[500px]`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                <p className="text-xs text-gray-500">{task.assignee}</p>
              </div>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={task.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {task.assignee
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
