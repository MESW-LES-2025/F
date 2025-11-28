"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreVertical, Trash2, Edit2, Check, X, Reply, Info, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
  onEdit: (id: string, newContent: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReply: (message: ChatMessageType) => void;
  onReplyClick?: (id: string) => void;
}

export function ChatMessage({
  message,
  isOwnMessage,
  onEdit,
  onDelete,
  onReply,
  onReplyClick,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const readCount = message.readLogs?.length || 0;
  // 2 Grey Checks: Sent, no reads.
  // 2 Blue Checks: Read by someone.

  const isRead = readCount > 0;

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onEdit(message.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit message:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "flex gap-3 max-w-[80%] group scroll-mt-20",
        isOwnMessage ? "ml-auto flex-row-reverse" : ""
      )}
    >
      <Avatar className="w-8 h-8 mt-1 shrink-0">
        <AvatarImage src={message.user?.imageUrl} />
        <AvatarFallback>{message.user?.name?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1 min-w-0">
        <div
          className={cn(
            "relative px-4 py-2 rounded-2xl text-sm shadow-sm",
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
          )}
        >
          {/* Parent Message Display */}
          {message.parent && (
            <div 
              onClick={() => message.parentId && onReplyClick?.(message.parentId)}
              className={cn(
                "mb-2 p-2 rounded text-xs border-l-2 cursor-pointer opacity-90 hover:opacity-100 transition-opacity",
                isOwnMessage 
                  ? "bg-primary-foreground/10 border-primary-foreground/50" 
                  : "bg-gray-100 border-primary"
              )}
            >
              <p className="font-semibold mb-0.5">
                {message.parent.user?.name || "Unknown"}
              </p>
              <p className="truncate">{message.parent.content}</p>
            </div>
          )}

          {!isOwnMessage && (
            <p className="text-xs font-semibold text-primary mb-1">
              {message.user?.name || "Unknown User"}
            </p>
          )}

          {isEditing ? (
            <div className="flex items-center gap-2 min-w-[200px]">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="h-8 text-black bg-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-black/10 text-current"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-black/10 text-current"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}

          <div
            className={cn(
              "flex items-center gap-1 mt-1 text-[10px] opacity-70",
              isOwnMessage ? "justify-end text-primary-foreground/80" : "text-gray-400"
            )}
          >
            <span>{format(new Date(message.createdAt), "HH:mm")}</span>
            {message.updatedAt !== message.createdAt && <span>(edited)</span>}
            {isOwnMessage && (
              <span className={cn("ml-1", isRead ? "text-blue-300" : "text-primary-foreground/60")}>
                <CheckCheck className="w-3 h-3" />
              </span>
            )}
          </div>

          {!isEditing && (
            <div 
              className={cn(
                "absolute top-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center gap-1",
                isOwnMessage ? "right-full mr-2" : "left-full ml-2"
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                onClick={() => onReply(message)}
              >
                <Reply className="w-4 h-4" />
              </Button>
              
              {isOwnMessage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onDelete(message.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowInfo(true)}>
                      <Info className="w-4 h-4 mr-2" />
                      Info
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Info</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Message</p>
              <p>{message.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                Sent {format(new Date(message.createdAt), "PP p")}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Read by</h4>
              {message.readLogs && message.readLogs.length > 0 ? (
                <div className="space-y-2">
                  {message.readLogs.map((log) => (
                    <div key={log.userId} className="flex items-center gap-2 text-sm">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback>{log.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="font-medium">{log.user.name}</span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {format(new Date(log.readAt), "p")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not read yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
