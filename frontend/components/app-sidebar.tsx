"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Home,
  Zap,
  Users,
  Calendar,
  Lightbulb,
  Settings,
  UserPlus,
  Menu,
  X,
  HousePlus,
  Bell,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Expenses", href: "/expenses", icon: Zap },
  { name: "Pantry", href: "/pantry", icon: Users },
  { name: "Activities", href: "/activities", icon: Calendar },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "House", href: "/house", icon: HousePlus },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

const support = [
  { name: "Get Started", href: "#", icon: Lightbulb },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Invite People", href: "#", icon: UserPlus },
];

export function AppSidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const houseId = searchParams.get("houseId");

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 lg:w-40 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex flex-col items-center border-b border-gray-200">
          <div className="w-12 h-12 mb-2">
            <img
              src="/concordia-logo.png"
              alt="Concordia"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xs text-gray-600 font-medium">Concordia</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-green-50 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Support Section */}
          <div className="pt-6">
            <p className="px-3 text-xs font-medium text-gray-500 mb-2">
              Support
            </p>
            {support.map((item) => {
              if (item.name === "Invite People") {
                const isActive = pathname === "/invite";
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/invite");
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-green-50 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              }

              const isActive =
                item.href === "/settings" && pathname === "/settings";
              if (item.href === "/settings") {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-green-50 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              }
              return (
                <button
                  key={item.name}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-md transition-colors"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.imageUrl || "/placeholder-user.jpg"} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || ""}
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
