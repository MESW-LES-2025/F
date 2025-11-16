export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User & {
    houses: { id: string }[];
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  assigneeAvatar: string;
  status: "todo" | "doing" | "done";
  deadline?: Date;
  createdAt: Date;
}

export interface House {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  invitationCode: string;
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
}
