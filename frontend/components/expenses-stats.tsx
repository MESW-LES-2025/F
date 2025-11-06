import { Card } from "@/components/ui/card"
import { expenses } from "@/lib/data"

export function ExpensesStats() {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const avgExpense = totalExpenses / expenses.length

  const expensesByCategory = expenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const topCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0]

  const expensesByPerson = expenses.reduce(
    (acc, exp) => {
      acc[exp.paidBy] = (acc[exp.paidBy] || 0) + exp.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const topSpender = Object.entries(expensesByPerson).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
        <p className="text-2xl font-bold text-gray-900">{totalExpenses.toFixed(2)}€</p>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Average Expense</p>
        <p className="text-2xl font-bold text-gray-900">{avgExpense.toFixed(2)}€</p>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Top Category</p>
        <p className="text-2xl font-bold text-gray-900">{topCategory[0]}</p>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Top Spender</p>
        <p className="text-2xl font-bold text-gray-900">{topSpender[0]}</p>
      </Card>
    </div>
  )
}
