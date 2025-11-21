"use client";

import { useEffect, useState, useCallback } from "react";
import { notificationService } from "@/lib/notification-service";
import { UserNotification } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck, RefreshCcw, Bell, Home, ChefHat, Wallet, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function iconForCategory(cat: string | null | undefined) {
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
}

function timeAgo(iso: string) {
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

export default function NotificationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const unreadCount = items.filter((n) => !n.isRead).length;

  const load = useCallback(async (initial = false) => {
    initial ? setLoading(true) : setRefreshing(true);
    try {
      const data = await notificationService.list();
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(sorted);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load notifications";
      toast({ title: "Load failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { load(true); }, [load]);

  const markOne = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setItems((prev) => prev.map((n) => n.notification.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
    } catch (e) {
      toast({ title: "Mark failed", description: "Could not mark notification as read", variant: "destructive" });
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    } catch (e) {
      toast({ title: "Mark all failed", description: "Could not mark all notifications", variant: "destructive" });
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">All your recent activity and system messages.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Notifications</span>
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || refreshing}
              onClick={() => load(false)}
            >
              {refreshing ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={markingAll || unreadCount === 0}
              onClick={markAll}
            >
              {markingAll ? <CheckCheck className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
              Mark all read
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map(k => <Skeleton key={k} className="h-20 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground text-center">
            No notifications yet.
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <ul className="divide-y">
              {items.map(n => {
                const isUnread = !n.isRead;
                return (
                  <li
                    key={n.notification.id}
                    className={cn(
                      "px-4 py-3 flex gap-3 transition-colors",
                      isUnread ? "bg-background hover:bg-accent/40" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="mt-1 shrink-0">{iconForCategory(n.notification.category || null)}</div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className={cn("text-sm font-medium", isUnread && "text-foreground")}>{n.notification.title}</p>
                          {n.notification.body && (
                            <p className="text-xs text-muted-foreground whitespace-pre-line">{n.notification.body}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {isUnread && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markOne(n.notification.id)}
                            className="h-7 px-2 text-xs"
                          >
                            Mark read
                          </Button>
                        )}
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
      </Card>
    </div>
  );
}
