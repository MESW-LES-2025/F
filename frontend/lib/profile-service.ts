import type { User } from './types'
import { apiGet } from './api-client'

class ProfileService {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<User> {
    return apiGet<User>('/auth/profile', { requiresAuth: true })
  }
}

export const profileService = new ProfileService()
