import type { User } from "./types";
import { apiGet, apiUpload } from "./api-client";
import { apiDelete } from "./api-client";
import { apiPatch } from "./api-client";
import { authService } from "./auth-service";

class ProfileService {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<User> {
    return apiGet<User>("/user", { requiresAuth: true });
  }

  /**
   * Delete the current user's account.
   * This will call the API and then clear local tokens/session.
   */
  async deleteAccount(): Promise<void> {
    try {
      await apiDelete("/user", { requiresAuth: true });
    } catch (error) {
      // Let caller handle error, but ensure we still clear local state if deletion succeeded server-side
      throw error;
    } finally {
      // Clear local tokens/session regardless to ensure client is signed out
      try {
        await authService.logoutAllDevices();
      } catch (e) {
        console.error(
          "Failed to clear local session after account deletion",
          e,
        );
      }
    }
  }

  /**
   * Update the user's profile information.
   */
  async updateProfile(payload: {
    name?: string;
    email?: string;
    username?: string;
  }): Promise<User> {
    return apiPatch<User>("/user", payload, { requiresAuth: true });
  }

  /**
   * Upload a profile image for the current user.
   */
  async uploadImage(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("file", file);

    return apiUpload<User>("/user/upload-image", formData, {
      requiresAuth: true,
    });
  }
}

export const profileService = new ProfileService();
