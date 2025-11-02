import { Card } from "@/components/ui/card"

export function MetricsCards() {
  const metrics = [
    { label: "Tasks Completed", value: "3" },
    { label: "Pending Tasks", value: "2" },
    { label: "Top Contributor", value: "Joana Maria" },
    { label: "Total Expenses", value: "97.50€" },
    { label: "Top Spender", value: "João Félix" },
    { label: "Top Expense Category", value: "Groceries" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="p-3 md:p-4 bg-white">
          <p className="text-xs text-gray-600 mb-1 md:mb-2">{metric.label}</p>
          <p className="text-lg md:text-xl font-bold text-gray-900 truncate">{metric.value}</p>
        </Card>
      ))}
    </div>
  )
}
