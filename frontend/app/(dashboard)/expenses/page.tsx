"use client"

import { useState } from "react"
import { ExpensesHeader } from "@/components/expenses-header"
import { ExpensesStats } from "@/components/expenses-stats"
import { ExpensesList } from "@/components/expenses-list"
import { useHouse } from "@/lib/house-context"

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
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No house selected</p>
            <p className="text-sm text-gray-400">Please select a house to view expenses</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
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
      <ExpensesStats houseId={houseId} refreshTrigger={refreshTrigger} />
      <ExpensesList 
        houseId={houseId} 
        refreshTrigger={refreshTrigger}
        sortField={sortField}
        sortOrder={sortOrder}
        filterCategory={filterCategory}
        filterDateFrom={filterDateFrom}
        filterDateTo={filterDateTo}
      />
    </div>
  )
}
