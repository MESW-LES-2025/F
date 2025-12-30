import {
  Home,
  Zap,
  Users,
  Calendar,
  Lightbulb,
  Settings,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-40 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 flex flex-col items-center border-b border-gray-200">
        <div className="w-12 h-12 mb-2">
          <img
            src="/concordia-logo.png"
            alt="Concordia"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 bg-green-50 rounded-md">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
          <Zap className="w-4 h-4" />
          <span>Expenses</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
          <Users className="w-4 h-4" />
          <span>Pantry</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
          <Calendar className="w-4 h-4" />
          <span>Activities</span>
        </button>

        {/* Support Section */}
        <div className="pt-6">
          <p className="px-3 text-xs font-medium text-gray-500 mb-2">Support</p>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
            <Lightbulb className="w-4 h-4" />
            <span>Get Started</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
            <UserPlus className="w-4 h-4" />
            <span>Invite People</span>
          </button>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.imageUrl || user?.avatar} />
            <AvatarFallback>
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
