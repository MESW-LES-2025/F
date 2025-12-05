"use client"

import { useState } from "react"
import { ExpensesHeader } from "@/components/expenses-header"
import { ExpenseQuickStats } from "@/components/expense-quick-stats"
import { ExpensesList } from "@/components/expenses-list"
import { BalancesWidget } from "@/components/balances-widget"
import { SpendingTrendsChart } from "@/components/spending-trends-chart"
import { CategoryBreakdownChart } from "@/components/category-breakdown-chart"
import { useHouse } from "@/lib/house-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExpensesPage() {
  const { selectedHouse } = useHouse()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Filter and sort state
  const [sortField, setSortField] = useState<"date" | "amount" | "payer">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterDateFrom, setFilterDateFrom] = useState<string>("")
  const [filterDateTo, setFilterDateTo] = useState<string>("")
  
  // Get houseId from context
  const houseId = selectedHouse?.id

  const handleExpenseCreated = () => {
    // Increment trigger to refresh both stats and list
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleSortFieldChange = (value: string) => {
    setSortField(value as "date" | "amount" | "payer")
  }

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value as "asc" | "desc")
  }

  if (!selectedHouse) {
    return (
      <>
        <ExpensesHeader 
          houseId={houseId} 
          onExpenseCreated={handleExpenseCreated}
          filterCategory={filterCategory}
          onFilterCategoryChange={setFilterCategory}
          filterDateFrom={filterDateFrom}
          onFilterDateFromChange={setFilterDateFrom}
          filterDateTo={filterDateTo}
          onFilterDateToChange={setFilterDateTo}
          sortField={sortField}
          onSortFieldChange={handleSortFieldChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
        />
        <div className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No house selected</p>
              <p className="text-sm text-gray-400">Please select a house to view expenses</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <ExpensesHeader 
        houseId={houseId} 
        onExpenseCreated={handleExpenseCreated}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        filterDateFrom={filterDateFrom}
        onFilterDateFromChange={setFilterDateFrom}
        filterDateTo={filterDateTo}
        onFilterDateToChange={setFilterDateTo}
        sortField={sortField}
        onSortFieldChange={handleSortFieldChange}
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
      />
      
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Quick Stats Overview */}
        <ExpenseQuickStats houseId={houseId} key={`stats-${refreshTrigger}`} />

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
          <TabsTrigger value="expenses" className="cursor-pointer">Expenses</TabsTrigger>
          <TabsTrigger value="balances" className="cursor-pointer">Balances</TabsTrigger>
          <TabsTrigger value="analytics" className="cursor-pointer">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Dashboard with key insights */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <BalancesWidget houseId={houseId} key={`balances-${refreshTrigger}`} onRefresh={handleExpenseCreated} />
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>Latest transactions in your household</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpensesList 
                  houseId={houseId} 
                  refreshTrigger={refreshTrigger}
                  sortField="date"
                  sortOrder="desc"
                  filterCategory="all"
                  filterDateFrom=""
                  filterDateTo=""
                  compact={true}
                  limit={5}
                />
              </CardContent>
            </Card>
          </div>
          <SpendingTrendsChart houseId={houseId} key={`trends-${refreshTrigger}`} />
        </TabsContent>

        {/* Expenses Tab - Full expense list */}
        <TabsContent value="expenses" className="space-y-6">
          <ExpensesList 
            houseId={houseId} 
            refreshTrigger={refreshTrigger}
            sortField={sortField}
            sortOrder={sortOrder}
            filterCategory={filterCategory}
            filterDateFrom={filterDateFrom}
            filterDateTo={filterDateTo}
          />
        </TabsContent>

        {/* Balances Tab - Detailed balances and settlements */}
        <TabsContent value="balances" className="space-y-6">
          <BalancesWidget houseId={houseId} key={`balances-detail-${refreshTrigger}`} onRefresh={handleExpenseCreated} />
        </TabsContent>

        {/* Analytics Tab - Charts and insights */}
        <TabsContent value="analytics" className="space-y-6">
          <SpendingTrendsChart houseId={houseId} key={`trends-analytics-${refreshTrigger}`} />
          <CategoryBreakdownChart houseId={houseId} key={`category-${refreshTrigger}`} />
        </TabsContent>
      </Tabs>
      </div>
    </>
  )
}

