import type { AuthResponse, User } from "./types";
import { apiPost, ApiError } from "./api-client";

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Initialize from cookies (server will set HttpOnly cookies in production)
    if (typeof window !== "undefined") {
      this.accessToken = this.getCookie("access_token");
      this.refreshToken = this.getCookie("refresh_token");
    }
  }

  /**
   * Get cookie value by name
   */
  private getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  }

  /**
   * Set cookie (client-side fallback)
   * In production, backend should set HttpOnly Secure cookies
   */
  private setCookie(name: string, value: string, days: number = 7): void {
    if (typeof document === "undefined") return;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}`;
  }

  /**
   * Remove cookie (client-side fallback)
   */
  private removeCookie(name: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const data = await apiPost<AuthResponse>("/auth/verify-email", {
        token,
      });
      this.setTokens(data.access_token, data.refresh_token);
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw error;
    }
  }

  async register(
    email: string,
    username: string,
    password: string,
    name: string,
  ): Promise<AuthResponse> {
    try {
      const data = await apiPost<AuthResponse>("/auth/register", {
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
      const data = await apiPost<AuthResponse>("/auth/login", {
        email,
        password,
      });
      this.setTokens(data.access_token, data.refresh_token);
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await apiPost(
          "/auth/logout",
          { refresh_token: this.refreshToken },
          { requiresAuth: true },
        );
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
    this.clearTokens();
  }

  /**
   * Logout from all devices / invalidate all sessions server-side
   * Clears locally stored tokens on success or failure to ensure client is signed out
   */
  async logoutAllDevices(): Promise<void> {
    try {
      await apiPost("/auth/logout-all", {}, { requiresAuth: true });
    } catch (error) {
      console.error("Logout all devices failed:", error);
      // Proceed to clear tokens locally regardless of server failure
    }
    this.clearTokens();
  }

  /**
   * Change the user's password. Caller is responsible for signing out the user
   * if they want to force re-authentication after a password change.
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      await apiPost(
        "/auth/change-password",
        { currentPassword, newPassword },
        { requiresAuth: true },
      );
    } catch (error) {
      // Re-throw ApiError or other errors for the caller to handle
      if (error instanceof ApiError) throw error;
      throw error;
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const data = await apiPost<AuthResponse>("/auth/refresh", {
        refresh_token: this.refreshToken,
      });
      this.setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== "undefined") {
      // Store in cookies only (best practice for auth tokens)
      // In production, backend should set HttpOnly Secure cookies for auto-refresh
      this.setCookie("access_token", accessToken, 7);
      this.setCookie("refresh_token", refreshToken, 7);
    }
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== "undefined") {
      // Remove from cookies only
      this.removeCookie("access_token");
      this.removeCookie("refresh_token");
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiPost<{ message: string }>("/auth/forgot-password", { email });
  }

  /**
   * Reset password
   */
  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    return apiPost<{ message: string }>("/auth/reset-password", {
      token,
      password,
    });
  }

  async exchangeGoogleCode(code: string): Promise<AuthResponse> {
    try {
      const data = await apiPost<AuthResponse>("/auth/google/exchange", {
        code,
      });
      this.setTokens(data.access_token, data.refresh_token);
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
export type { AuthResponse, User } from "./types";
