import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { expenses } from "@/lib/data"
import { format } from "date-fns"

export function ExpensesList() {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Recent Expenses</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {expenses.map((expense) => {
          const splitCount = expense.splitWith.length
          const perPersonAmount = expense.amount / splitCount

          return (
            <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={expense.paidByAvatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {expense.paidBy
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                      <Badge variant="secondary" className="text-xs">
                        {expense.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Paid by {expense.paidBy}</span>
                      <span>•</span>
                      <span>{format(expense.date, "MMM d, yyyy")}</span>
                      <span>•</span>
                      <span>Split {splitCount} ways</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{expense.amount.toFixed(2)}€</p>
                  <p className="text-xs text-gray-500">{perPersonAmount.toFixed(2)}€ per person</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
