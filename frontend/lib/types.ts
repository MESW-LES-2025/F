export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User & {
    houses: { id: string }[];
  };
}

export type RecurrencePattern = "DAILY" | "WEEKLY" | "MONTHLY";

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string; // primary assignee display name
  assigneeAvatar?: string;
  assignedUsers?: { id: string; name: string; avatar?: string }[];
  status: "todo" | "doing" | "done";
  deadline?: Date;
  createdAt: Date;
  houseId: string;
  houseName: string;
  archived: boolean;
  archivedAt?: Date | null;
  size?: "SMALL" | "MEDIUM" | "LARGE" | "XL";
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceInterval?: number;
  nextRecurrenceDate?: Date | null;
  lastRecurrenceDate?: Date | null;
  parentRecurringTaskId?: string | null;
}

export interface House {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  invitationCode: string;
  users?: {
    user: {
      id: string;
      name: string | null;
      username: string | null;
      imageUrl: string | null;
    };
  }[];
}

export interface HouseDetails {
  house: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    invitationCode: string;
  };
  users: {
    id: string;
    name: string;
    email: string;
    username: string;
    imageUrl?: string;
    houses: {
      role: string;
    }[];
  }[];
}

export interface ExpenseSplit {
  id?: string;
  userId: string;
  percentage: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
  paidByAvatar: string;
  date: Date;
  splitWith: string[];
  splits?: ExpenseSplit[];
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  addedBy: string;
  addedByAvatar: string;
  expiryDate?: Date;
  lowStock: boolean;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  name: string;
  avatar?: string;
  imageUrl?: string;
  createdAt?: string;
  googleId?: string;
}

export interface ChatMessageUserSummary {
  id: string;
  name: string;
  imageUrl?: string; // optional avatar/image
}

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  houseId: string;
  parentId?: string | null;
  parent?: Partial<ChatMessage> | null;
  user?: ChatMessageUserSummary | null;
  createdAt: string;
  updatedAt: string;
  readLogs?: {
    userId: string;
    readAt: string;
    user: {
      id: string;
      name: string;
    };
  }[];
}

// Notifications
export type NotificationCategory =
  | "HOUSE"
  | "PANTRY"
  | "EXPENSES"
  | "SCRUM"
  | "CHAT"
  | "OTHER";

export type NotificationLevel = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface NotificationPayload {
  id: string;
  title: string;
  body?: string | null;
  actionUrl?: string | null;
  level?: NotificationLevel | null;
  category?: NotificationCategory | null;
  houseId?: string | null;
}

export interface UserNotification {
  id?: string;
  userId: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  notification: NotificationPayload;
}

export interface HouseToUser {
  id: string;
  houseId: string;
  userId: string;
  joinedAt: Date;
  role: string | null;
}
