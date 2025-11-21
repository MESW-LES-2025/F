"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2, Home, ChefHat, Wallet, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationService } from "@/lib/notification-service";
import { UserNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);
  // Popup shows only unread for brevity
  const displayed = useMemo(() => items.filter((n) => !n.isRead), [items]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      // Fetch both read and unread (backend returns full list filtered by optional params)
      const all = await notificationService.list();
      // Sort newest first
      const sorted = [...all].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // Optionally cap to latest 30 to keep popup light
      setItems(sorted.slice(0, 30));
    } catch {
      // ignore for now; could add toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open) fetchAll();
  }, [open]);

  const markOne = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setItems((prev) =>
        prev.map((n) =>
          n.notification.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
    } catch {}
  };

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    } catch {}
  };

  const categoryIcon = (cat: string | null | undefined) => {
    switch (cat) {
      case "HOUSE":
        return <Home className="h-4 w-4 text-blue-600" />;
      case "PANTRY":
        return <ChefHat className="h-4 w-4 text-emerald-600" />;
      case "EXPENSES":
        return <Wallet className="h-4 w-4 text-amber-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 py-0 text-[10px] leading-5 rounded-full bg-red-600 text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Notifications</span>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAll}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all
            </Button>
          )}
        </div>
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No unread notifications.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {displayed.map((n) => {
                const category = n.notification.category || null;
                return (
                  <li
                    key={n.notification.id}
                    className={cn(
                      "px-4 py-3 flex gap-3 transition-colors",
                      !n.isRead ? "bg-background hover:bg-muted/60" : "hover:bg-muted/40"
                    )}
                  >
                    <div className="mt-0.5">{categoryIcon(category)}</div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className={cn("text-sm font-medium", !n.isRead && "text-foreground")}>{n.notification.title}</p>
                          {/* Body intentionally omitted for popup brevity */}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markOne(n.notification.id)}
                          className="h-7 px-2 text-xs"
                        >
                          Mark read
                        </Button>
                        {n.notification.actionUrl && (
                          <a
                            href={n.notification.actionUrl}
                            className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                            onClick={() => markOne(n.notification.id)}
                          >
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
        <Separator />
        <div className="px-4 py-2 text-[11px] text-muted-foreground flex justify-between items-center">
          <span>{unreadCount} unread</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchAll()}
              className="underline hover:no-underline"
            >
              Refresh
            </button>
            <a
              href="/notifications"
              className="underline hover:no-underline"
            >
              View all
            </a>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
