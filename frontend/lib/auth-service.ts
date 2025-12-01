import type { AuthResponse, User } from './types'
import { apiPost, ApiError } from './api-client'

class AuthService {
  async register(email: string, username: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const data = await apiPost<AuthResponse>('/auth/register', {
        email,
        username,
        password,
        name,
      });
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const data = await apiPost<AuthResponse>('/auth/login', {
        email,
        password,
      });
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout', {}, { requiresAuth: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * Logout from all devices / invalidate all sessions server-side
   */
  async logoutAllDevices(): Promise<void> {
    try {
      await apiPost('/auth/logout-all', {}, { requiresAuth: true });
    } catch (error) {
      console.error('Logout all devices failed:', error);
    }
  }

  /**
   * Change the user's password. Caller is responsible for signing out the user
   * if they want to force re-authentication after a password change.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiPost('/auth/change-password', { currentPassword, newPassword }, { requiresAuth: true });
    } catch (error) {
      // Re-throw ApiError or other errors for the caller to handle
      if (error instanceof ApiError) throw error;
      throw error;
    }
  }

  async refreshAccessToken(): Promise<string> {
      // This is now handled automatically by api-client.ts via HttpOnly cookies
      // We can just trigger a refresh call if needed, but usually the client handles it on 401
      // For explicit refresh (e.g. app init), we can call the endpoint
      try {
        const data = await apiPost<AuthResponse>('/auth/refresh');
        return data.access_token;
      } catch (error) {
        throw error;
      }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiPost<{ message: string }>('/auth/forgot-password', { email });
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiPost<{ message: string }>('/auth/reset-password', { token, password });
  }

  async exchangeGoogleCode(code: string): Promise<AuthResponse> {
    try {
      const data = await apiPost<AuthResponse>('/auth/google/exchange', {
        code,
      });
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const data = await apiPost<AuthResponse>('/auth/verify-email', {
        token,
      });
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw error;
    }
  }
}

export const authService = new AuthService();

// Re-export types for backwards compatibility and convenience
export type { AuthResponse, User } from './types';
