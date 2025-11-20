import { apiGet } from './api-client'
import type { PantryItem } from './types'

export interface PantryItemResponse {
  id: string
  quantity: number
  expiryDate?: string
  item: {
    id: string
    name: string
    measurementUnit: string
    category: string
  }
  user: {
    id: string
    name: string
    avatarUrl?: string
  }
}

export interface PantryResponse {
  id: string
  houseId: string
  items: PantryItemResponse[]
}

/**
 * Transform backend pantry item response to frontend PantryItem type
 */
function transformPantryItem(backendItem: PantryItemResponse): PantryItem {
  return {
    id: backendItem.item?.id ?? backendItem.id,
    name: backendItem.item?.name ?? 'Unknown',
    quantity: backendItem.quantity ?? 0,
    unit: backendItem.item?.measurementUnit ?? 'unit',
    category: backendItem.item?.category ?? 'OTHER',
    addedBy: backendItem.user?.name ?? 'Unknown',
    addedByAvatar: backendItem.user?.avatarUrl ?? '',
    expiryDate: backendItem.expiryDate ? new Date(backendItem.expiryDate) : undefined,
    lowStock: Number(backendItem.quantity ?? 0) <= 1,
  }
}

/**
 * Get pantry items for a specific house
 */
export async function getPantryItems(houseId: string): Promise<PantryItem[]> {
  try {
    // First, get all pantries
    const pantries = await apiGet<PantryResponse[]>('/pantry', { 
      requiresAuth: true
    })
    
    // Find the pantry for this house
    const pantry = pantries.find((p) => p.houseId === houseId)
    
    if (!pantry) {
      return []
    }
    
    // Fetch the full pantry details
    const pantryDetails = await apiGet<PantryResponse>(
      `/pantry/${houseId}/${pantry.id}`,
      { 
        requiresAuth: true
      }
    )
    
    return (pantryDetails?.items ?? []).map(transformPantryItem)
  } catch (error) {
    console.error('Failed to fetch pantry items:', error)
    return []
  }
}

/**
 * Get all pantry items (fallback for when no house is selected)
 */
export async function getAllPantryItems(): Promise<PantryItem[]> {
  try {
    const pantries = await apiGet<PantryResponse[]>('/pantry', { 
      requiresAuth: true
    })
    
    if (!pantries || pantries.length === 0) {
      return []
    }
    
    // Get items from the first pantry
    const firstPantry = pantries[0]
    const pantryDetails = await apiGet<PantryResponse>(
      `/pantry/${firstPantry.houseId}/${firstPantry.id}`,
      { 
        requiresAuth: true
      }
    )
    
    return (pantryDetails?.items ?? []).map(transformPantryItem)
  } catch (error) {
    console.error('Failed to fetch pantry items:', error)
    return []
  }
}

