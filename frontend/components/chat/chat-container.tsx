"use client";

import Pusher from "pusher-js";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { chatService } from "@/lib/chat-service";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { useHouse } from "@/lib/house-context";

export function ChatContainer() {
  const { user } = useAuth();
  const { selectedHouse } = useHouse();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null);

  const houseId = selectedHouse?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight effect
      element.classList.add("bg-yellow-100/50");
      setTimeout(() => {
        element.classList.remove("bg-yellow-100/50");
      }, 2000);
    } else {
      console.log("Message not found in current view");
    }
  };

  const fetchMessages = useCallback(
    async (reset = false) => {
      if (!houseId || !user) return;

      try {
        const currentCursor = reset ? undefined : cursor;
        const res = await chatService.readMessages(houseId, 20, currentCursor);

        if (reset) {
          setMessages(res.messages.reverse());
        } else {
          setMessages((prev) => [...res.messages.reverse(), ...prev]);
        }

        // Mark unread messages as read
        const unreadMessageIds = res.messages
          .filter(
            (msg) =>
              msg.userId !== user.id &&
              !msg.readLogs?.some((log) => log.userId === user.id),
          )
          .map((msg) => msg.id);

        if (unreadMessageIds.length > 0) {
          chatService.markMessagesAsRead(unreadMessageIds);
        }

        setCursor(res.nextCursor || undefined);
        setHasMore(!!res.nextCursor);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError("Failed to load messages");
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [houseId, cursor, user],
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !isFetchingMore) {
      setIsFetchingMore(true);
      // Save scroll position
      const scrollHeight = e.currentTarget.scrollHeight;

      fetchMessages().then(() => {
        // Restore scroll position
        if (containerRef.current) {
          containerRef.current.scrollTop =
            containerRef.current.scrollHeight - scrollHeight;
        }
      });
    }
  };

  const searchParams = useSearchParams();
  const messageIdParam = searchParams.get("messageId");

  // Initial load and subscription
  useEffect(() => {
    if (!houseId) return;

    setIsLoading(true);
    fetchMessages(true).then(() => {
      if (messageIdParam) {
        setTimeout(() => scrollToMessage(messageIdParam), 500);
      } else {
        setTimeout(scrollToBottom, 100);
      }
    });

    // Pusher subscription
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`house-${houseId}-chat`);

    channel.bind("message-created", (data: ChatMessageType) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });

      // Mark as read if not own message
      if (data.userId !== user?.id) {
        chatService.markMessagesAsRead([data.id]);
      }

      setTimeout(scrollToBottom, 100);
    });

    channel.bind("message-updated", (data: ChatMessageType) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.id ? data : msg)),
      );
    });

    channel.bind("message-deleted", (data: { id: string }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
    });

    channel.bind(
      "message-read",
      (data: {
        messageId: string;
        userId: string;
        readAt: string;
        user: { id: string; name: string };
      }) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === data.messageId) {
              const existingLogs = msg.readLogs || [];
              if (existingLogs.some((r) => r.userId === data.userId)) {
                return msg;
              }
              return {
                ...msg,
                readLogs: [
                  ...existingLogs,
                  { userId: data.userId, readAt: data.readAt, user: data.user },
                ],
              };
            }
            return msg;
          }),
        );
      },
    );

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [houseId]);

  const handleSendMessage = async (content: string, parentId?: string) => {
    if (!houseId || !user) return;

    // Optimistic update
    const tempId = Math.random().toString();
    const optimisticMessage: ChatMessageType = {
      id: tempId,
      content,
      userId: user.id,
      houseId,
      parentId: parentId || null,
      parent: parentId ? replyingTo : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        imageUrl: user.imageUrl,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setReplyingTo(null);
    scrollToBottom();

    try {
      const newMessage = await chatService.createMessage(houseId, {
        content,
        parentId,
      });
      setMessages((prev) => {
        // Check if message already exists (from Pusher event)
        if (prev.some((msg) => msg.id === newMessage.id)) {
          // If it exists, remove the optimistic message
          return prev.filter((msg: ChatMessageType) => msg.id !== tempId);
        }
        // Otherwise replace optimistic message with real one
        return prev.map((msg: ChatMessageType) =>
          msg.id === tempId ? newMessage : msg,
        );
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  const handleEditMessage = async (id: string, newContent: string) => {
    try {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, content: newContent } : msg,
        ),
      );
      await chatService.updateMessage(id, newContent);
    } catch (err) {
      console.error("Failed to update message:", err);
      // Revert on failure (would need to fetch original message or store it)
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      await chatService.deleteMessage(id);
    } catch (err) {
      console.error("Failed to delete message:", err);
      // Revert?
    }
  };

  if (!houseId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please select a house to start chatting.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen bg-gray-50">
      <ChatHeader />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {isLoading && !isFetchingMore ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <>
            {isFetchingMore && (
              <div className="flex justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              </div>
            )}
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8 bg-white/80 rounded-lg max-w-md mx-auto mt-10 shadow-sm">
                <p className="font-medium">No messages yet</p>
                <p className="text-sm mt-1">Be the first to say hello!</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isOwnMessage={msg.userId === user?.id}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onReply={setReplyingTo}
                    onReplyClick={scrollToMessage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </>
        )}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}
