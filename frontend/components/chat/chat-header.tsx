import { MessageSquare } from "lucide-react";
import { HouseSelector } from "@/components/house/house-selector";
import { NotificationsBell } from "@/components/notifications/notifications-bell";

interface ChatHeaderProps {
  houseName?: string;
}

export function ChatHeader({ houseName }: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base md:text-lg font-semibold text-gray-900">
            Chat
          </h1>
          <HouseSelector />
        </div>
        <NotificationsBell />
      </div>
    </div>
  );
}
