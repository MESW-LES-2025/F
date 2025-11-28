import { apiGet, apiPost, apiPatch, apiDelete } from './api-client'
import type { Expense } from './types'

export interface CreateExpensePayload {
  amount: number
  description: string
  category: string
  paidById: string
  houseId: string
  splitWith: string[]
  date?: string
}

export interface UpdateExpensePayload {
  amount?: number
  description?: string
  category?: string
  paidById?: string
  houseId?: string
  splitWith?: string[]
  date?: string
}

export interface ExpenseResponse {
  id: string
  amount: number
  description: string
  category: string
  date: string
  paidById: string
  houseId: string
  splitWith: string[]
  createdAt: string
  updatedAt: string
  paidBy: {
    id: string
    name: string | null
    email: string
    username: string
    imageUrl: string | null
  }
  house: {
    id: string
    name: string
  }
}

/**
 * Transform backend expense response to frontend Expense type
 */
function transformExpense(backendExpense: ExpenseResponse): Expense {
  return {
    id: backendExpense.id,
    title: backendExpense.description,
    amount: backendExpense.amount,
    category: backendExpense.category,
    paidBy: backendExpense.paidBy.name || backendExpense.paidBy.username,
    paidByAvatar: backendExpense.paidBy.imageUrl || '',
    date: new Date(backendExpense.date),
    splitWith: backendExpense.splitWith,
  }
}

/**
 * Get all expenses or filter by house
 */
export async function getExpenses(filters?: {
  houseId?: string
}): Promise<Expense[]> {
  const expenses = await apiGet<ExpenseResponse[]>('/expenses', {
    requiresAuth: true,
    params: filters as Record<string, string>,
  })
  
  return expenses.map(transformExpense)
}

/**
 * Get a single expense by ID
 */
export async function getExpense(expenseId: string): Promise<Expense> {
  const expense = await apiGet<ExpenseResponse>(`/expenses/${expenseId}`, {
    requiresAuth: true,
  })
  
  return transformExpense(expense)
}

/**
 * Create a new expense
 */
export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const expense = await apiPost<ExpenseResponse>('/expenses', payload, {
    requiresAuth: true,
  })
  
  return transformExpense(expense)
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  expenseId: string,
  payload: UpdateExpensePayload
): Promise<Expense> {
  const expense = await apiPatch<ExpenseResponse>(
    `/expenses/${expenseId}`,
    payload,
    {
      requiresAuth: true,
    }
  )
  
  return transformExpense(expense)
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  await apiDelete(`/expenses/${expenseId}`, {
    requiresAuth: true,
  })
}

export interface ExpenseSummary {
  totalSpending: number
  perPersonTotals: Array<{
    userId: string
    userName: string
    userImageUrl: string | null
    totalPaid: number
    totalOwed: number
    balance: number
  }>
  expenseCount: number
  categoryBreakdown: Array<{
    category: string
    total: number
    percentage: number
  }>
}

/**
 * Get expense summary for a house
 */
export async function getExpenseSummary(houseId: string): Promise<ExpenseSummary> {
  return await apiGet<ExpenseSummary>('/expenses/summary', {
    requiresAuth: true,
    params: { houseId },
  })
}

export interface Balance {
  userId: string
  userName: string
  userImageUrl: string | null
  balance: number
}

export interface Settlement {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

export interface BalancesResponse {
  balances: Balance[]
  settlements: Settlement[]
}

/**
 * Get balances and settlement suggestions for a house
 */
export async function getBalances(houseId: string): Promise<BalancesResponse> {
  return await apiGet<BalancesResponse>('/expenses/balances', {
    requiresAuth: true,
    params: { houseId },
  })
}

export interface SpendingTrend {
  date: string
  total: number
  count: number
}

export interface SpendingTrendsResponse {
  data: SpendingTrend[]
  period: string
  totalDays: number
}

/**
 * Get spending trends over time for a house
 */
export async function getSpendingTrends(
  houseId: string,
  period: 'day' | 'week' | 'month' = 'day',
  days: number = 30
): Promise<SpendingTrendsResponse> {
  return await apiGet<SpendingTrendsResponse>('/expenses/trends', {
    requiresAuth: true,
    params: { houseId, period, days: days.toString() },
  })
}

export interface CategoryBreakdown {
  category: string
  total: number
  count: number
  percentage: number
  averageAmount: number
}

export interface CategoryBreakdownResponse {
  categories: CategoryBreakdown[]
  totalSpending: number
}

/**
 * Get spending breakdown by category for a house
 */
export async function getCategoryBreakdown(houseId: string): Promise<CategoryBreakdownResponse> {
  return await apiGet<CategoryBreakdownResponse>('/expenses/categories', {
    requiresAuth: true,
    params: { houseId },
  })
}

