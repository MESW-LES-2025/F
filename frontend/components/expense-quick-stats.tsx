'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Receipt, TrendingUp, Users } from 'lucide-react'
import { getExpenseSummary, type ExpenseSummary } from '@/lib/expense-service'

interface ExpenseQuickStatsProps {
  houseId: string
}

export function ExpenseQuickStats({ houseId }: ExpenseQuickStatsProps) {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const data = await getExpenseSummary(houseId)
        setSummary(data)
      } catch (error) {
        console.error('Failed to fetch expense summary:', error)
      } finally {
        setLoading(false)
      }
    }

    if (houseId) {
      fetchSummary()
    }
  }, [houseId])

  if (loading || !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const topCategory = summary.categoryBreakdown[0]
  const averagePerPerson =
    summary.perPersonTotals.length > 0
      ? summary.totalSpending / summary.perPersonTotals.length
      : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.totalSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Across {summary.expenseCount} expense{summary.expenseCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.expenseCount}</div>
          <p className="text-xs text-muted-foreground">
            {summary.perPersonTotals.length} member
            {summary.perPersonTotals.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {topCategory ? topCategory.category : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {topCategory
              ? `$${topCategory.total.toFixed(2)} (${topCategory.percentage.toFixed(0)}%)`
              : 'No expenses yet'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg per Person</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${averagePerPerson.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Per household member
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
