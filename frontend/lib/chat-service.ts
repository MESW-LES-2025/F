import { apiGet, apiPost, apiPatch, apiDelete } from "./api-client";
import type { ChatMessage } from "./types";

export interface ReadMessagesResult {
  messages: ChatMessage[];
  nextCursor: string | null;
}

class ChatService {
  async createMessage(
    houseId: string,
    payload: { content: string; parentId?: string },
  ): Promise<ChatMessage> {
    const message = await apiPost<ChatMessage>(`/chat/${houseId}`, payload, {
      requiresAuth: true,
    });
    return message;
  }

  async updateMessage(
    messageId: string,
    content: string,
  ): Promise<ChatMessage> {
    const message = await apiPatch<ChatMessage>(
      `/chat/${messageId}`,
      { content },
      { requiresAuth: true },
    );
    return message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await apiDelete(`/chat/${messageId}`, { requiresAuth: true });
  }

  async readMessages(
    houseId: string,
    limit = 20,
    cursor?: string,
  ): Promise<ReadMessagesResult> {
    const params: Record<string, string | number | boolean> = { limit };
    if (cursor) params.cursor = cursor;
    const res = await apiGet<ReadMessagesResult>(`/chat/${houseId}/read`, {
      requiresAuth: true,
      params,
    });
    return res;
  }

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;
    await apiPost(
      `/chat/mark-messages-read`,
      { messageIds },
      { requiresAuth: true },
    );
  }
}

export const chatService = new ChatService();

export default chatService;
