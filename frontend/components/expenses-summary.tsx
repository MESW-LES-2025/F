"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getExpenseSummary, type ExpenseSummary } from "@/lib/expense-service"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ExpensesSummaryProps {
  houseId?: string
  refreshTrigger?: number
}

export function ExpensesSummary({ houseId, refreshTrigger }: ExpensesSummaryProps) {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (houseId) {
      loadSummary()
    }
  }, [houseId, refreshTrigger])

  const loadSummary = async () => {
    if (!houseId) return

    setIsLoading(true)
    setError(null)
    try {
      const data = await getExpenseSummary(houseId)
      setSummary(data)
    } catch (err) {
      console.error('Failed to load expense summary:', err)
      setError('Failed to load expense summary. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-white border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700 mb-2 font-medium">Total Spending</p>
          <p className="text-3xl font-bold text-blue-900">
            €{summary.totalSpending.toFixed(2)}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700 mb-2 font-medium">Total Expenses</p>
          <p className="text-3xl font-bold text-green-900">{summary.expenseCount}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <p className="text-sm text-purple-700 mb-2 font-medium">Average Expense</p>
          <p className="text-3xl font-bold text-purple-900">
            €{summary.expenseCount > 0 ? (summary.totalSpending / summary.expenseCount).toFixed(2) : '0.00'}
          </p>
        </Card>
      </div>

      {/* Per-Person Breakdown */}
      <Card className="p-6 bg-white border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Per-Person Breakdown</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Total Paid</TableHead>
                <TableHead className="text-right">Total Owed</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.perPersonTotals.map((person) => (
                <TableRow key={person.userId}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={person.userImageUrl || ''} alt={person.userName} />
                      <AvatarFallback>
                        {person.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{person.userName}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    €{person.totalPaid.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-orange-600">
                    €{person.totalOwed.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-bold ${
                        person.balance > 0
                          ? 'text-green-600'
                          : person.balance < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {person.balance > 0 ? '+' : ''}€{person.balance.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>• <strong>Total Paid:</strong> Amount the person has paid for expenses</p>
          <p>• <strong>Total Owed:</strong> Amount the person owes for their share of expenses</p>
          <p>• <strong>Balance:</strong> Net amount (positive = owed to them, negative = they owe)</p>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card className="p-6 bg-white border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
        <div className="space-y-4">
          {summary.categoryBreakdown.map((category) => (
            <div key={category.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 capitalize">
                  {category.category.toLowerCase().replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-600">
                  €{category.total.toFixed(2)} ({category.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
          {summary.categoryBreakdown.length === 0 && (
            <p className="text-center text-gray-500 py-4">No expenses yet</p>
          )}
        </div>
      </Card>
    </div>
  )
}
