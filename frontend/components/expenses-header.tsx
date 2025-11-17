"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateExpenseDialog } from "@/components/create-expense-dialog"
import { HouseSelector } from "@/components/house-selector"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ExpensesHeaderProps {
  houseId?: string
  onExpenseCreated?: () => void
  // Filter state
  filterCategory: string
  onFilterCategoryChange: (value: string) => void
  filterDateFrom: string
  onFilterDateFromChange: (value: string) => void
  filterDateTo: string
  onFilterDateToChange: (value: string) => void
  sortField: string
  onSortFieldChange: (value: string) => void
  sortOrder: string
  onSortOrderChange: (value: string) => void
}

export function ExpensesHeader({
  houseId,
  onExpenseCreated,
  filterCategory,
  onFilterCategoryChange,
  filterDateFrom,
  onFilterDateFromChange,
  filterDateTo,
  onFilterDateToChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
}: ExpensesHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-base md:text-lg font-semibold text-gray-900">Expenses</h1>
            <HouseSelector />
          </div>
          <CreateExpenseDialog houseId={houseId} onExpenseCreated={onExpenseCreated} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Sort By */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="sort-by" className="text-xs text-gray-600">Sort By</Label>
            <Select value={sortField} onValueChange={onSortFieldChange}>
              <SelectTrigger id="sort-by" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="payer">Payer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="sort-order" className="text-xs text-gray-600">Order</Label>
            <Select value={sortOrder} onValueChange={onSortOrderChange}>
              <SelectTrigger id="sort-order" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="filter-category" className="text-xs text-gray-600">Category</Label>
            <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
              <SelectTrigger id="filter-category" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="GROCERIES">Groceries</SelectItem>
                <SelectItem value="UTILITIES">Utilities</SelectItem>
                <SelectItem value="HOUSEHOLD">Household</SelectItem>
                <SelectItem value="FOOD">Food</SelectItem>
                <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-from" className="text-xs text-gray-600">From Date</Label>
            <Input
              id="date-from"
              type="date"
              value={filterDateFrom}
              onChange={(e) => onFilterDateFromChange(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-to" className="text-xs text-gray-600">To Date</Label>
            <Input
              id="date-to"
              type="date"
              value={filterDateTo}
              onChange={(e) => onFilterDateToChange(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
