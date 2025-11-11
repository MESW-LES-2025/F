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
