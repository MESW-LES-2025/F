import { apiGet, apiPatch } from "./api-client";
import { NotificationCategory, NotificationLevel, UserNotification } from "./types";

export interface NotificationFilters {
  category?: NotificationCategory;
  level?: NotificationLevel;
  isRead?: boolean;
}

class NotificationService {
  async list(filters: NotificationFilters = {}): Promise<UserNotification[]> {
    const params: Record<string, string | number | boolean> = {};
    if (filters.category) params.category = filters.category;
    if (filters.level) params.level = filters.level;
    if (filters.isRead !== undefined) params.isRead = filters.isRead;

    return apiGet<UserNotification[]>("/notifications", {
      requiresAuth: true,
      params,
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiPatch(`/notifications/${notificationId}`, {}, { requiresAuth: true });
  }

  async markAllAsRead(): Promise<void> {
    await apiPatch("/notifications", {}, { requiresAuth: true });
  }
}

export const notificationService = new NotificationService();
