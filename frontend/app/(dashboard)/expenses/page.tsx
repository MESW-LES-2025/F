import { ExpensesHeader } from "@/components/expenses-header"
import { ExpensesStats } from "@/components/expenses-stats"
import { ExpensesList } from "@/components/expenses-list"

export default function ExpensesPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <ExpensesHeader />
      <ExpensesStats />
      <ExpensesList />
    </div>
  )
}
