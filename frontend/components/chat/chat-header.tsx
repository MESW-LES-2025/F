import { MessageSquare } from "lucide-react";

interface ChatHeaderProps {
  houseName?: string;
}

export function ChatHeader({ houseName }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white shadow-sm">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <MessageSquare className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          {houseName || "House Chat"}
        </h1>
        <p className="text-xs text-gray-500">
          Chat with your housemates
        </p>
      </div>
    </div>
  );
}
