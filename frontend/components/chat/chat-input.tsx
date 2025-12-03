"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/lib/types";

interface ChatInputProps {
  onSendMessage: (content: string, parentId?: string) => Promise<void>;
  isLoading?: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

export function ChatInput({ 
  onSendMessage, 
  isLoading, 
  replyingTo, 
  onCancelReply 
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmit = async () => {
    if (!message.trim() || isLoading) return;
    
    try {
      await onSendMessage(message, replyingTo?.id);
      setMessage("");
      if (onCancelReply) onCancelReply();
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="max-w-4xl mx-auto">
        {replyingTo && (
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-t-lg border-b border-gray-200 mb-2 border-l-4 border-l-primary">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary">
                Replying to {replyingTo.user?.name || "Unknown"}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {replyingTo.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onCancelReply}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 py-3 px-4 resize-none rounded-2xl bg-gray-50 border-gray-200 focus:ring-1 focus:ring-primary focus:border-primary pr-12"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
            size="icon"
            className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
