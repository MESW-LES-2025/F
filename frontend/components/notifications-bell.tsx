"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  Loader2,
  Home,
  ChefHat,
  Wallet,
  Info,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationService } from "@/lib/notification-service";
import { UserNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useHouse } from "@/lib/house-context";
import { useRouter } from "next/navigation";

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
  const unreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items],
  );
  const [showCenter, setShowCenter] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { houses, setSelectedHouse } = useHouse();
  const router = useRouter();
  const displayed = useMemo(() => items.filter((n) => !n.isRead), [items]);
  const centerItems = useMemo(() => {
    return items.filter((n) => {
      if (
        activeCategory !== "ALL" &&
        n.notification.category !== activeCategory
      )
        return false;
      if (showUnreadOnly && n.isRead) return false;
      return true;
    });
  }, [items, activeCategory, showUnreadOnly]);

  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Fetch both read and unread
      const all = await notificationService.list();
      const sorted = [...all].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setItems(sorted.slice(0, 30));
    } catch {
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(true), 10000);
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
          n.notification.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
    } catch {}
  };

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );
    } catch {}
  };

  const dismissOne = async (id: string) => {
    try {
      await notificationService.dismiss(id);
      setItems((prev) =>
        prev.filter((n) => !(n.id === id || n.notification.id === id)),
      );
    } catch {}
  };

  const handleOpen = async (n: UserNotification, url?: string | null) => {
    try {
      await markOne(n.id || n.notification.id);

      // Context switch if houseId != NULL
      if (n.notification.houseId) {
        const targetHouse = houses.find((h) => h.id === n.notification.houseId);
        if (targetHouse) {
          setSelectedHouse(targetHouse);
        }
      }

      if (url) {
        router.push(url);
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to handle notification open", error);
    }
  };

  const categoryIcon = (cat: string | null | undefined) => {
    switch (cat) {
      case "HOUSE":
        return <Home className="h-4 w-4 text-blue-600" />;
      case "PANTRY":
        return <ChefHat className="h-4 w-4 text-emerald-600" />;
      case "EXPENSES":
        return <Wallet className="h-4 w-4 text-amber-600" />;
      case "SCRUM":
        return <CheckCheck className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string | null | undefined) => {
    switch (level) {
      case "URGENT":
        return "border-l-red-500";
      case "HIGH":
        return "border-l-orange-500";
      case "MEDIUM":
        return "border-l-yellow-500";
      case "LOW":
        return "border-l-blue-500";
      default:
        return "border-l-transparent";
    }
  };

  const categories = ["ALL", "HOUSE", "PANTRY", "EXPENSES", "SCRUM", "OTHER"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label="Notifications"
        >
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
      <PopoverContent className="w-[480px] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
          <div className="flex items-center gap-2">
            {showCenter && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowCenter(false)}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <span className="text-sm font-medium">Notifications</span>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={markAll}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all
              </Button>
            )}
          </div>
        </div>
        {!showCenter ? (
          displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No unread notifications.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <ul className="divide-y">
                {displayed.map((n) => {
                  const category = n.notification.category || null;
                  const rawUrl = n.notification.actionUrl;
                  // Force house invite notifications to use /invite (ignore any legacy UUID form)
                  const safeUrl =
                    rawUrl && n.notification.category === "HOUSE"
                      ? "/invite"
                      : rawUrl;
                  return (
                    <li
                      key={n.notification.id}
                      className={cn(
                        "px-4 py-3 flex gap-3 transition-colors border-l-2",
                        getLevelColor(n.notification.level),
                        !n.isRead
                          ? "bg-background hover:bg-muted/60"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <div className="mt-0.5">{categoryIcon(category)}</div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium",
                                !n.isRead && "text-foreground",
                              )}
                            >
                              {n.notification.title}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[11px] text-muted-foreground">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          {!n.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markOne(n.id || n.notification.id)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Mark
                            </Button>
                          )}
                          {safeUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpen(n, safeUrl)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Open
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              dismissOne(n.id || n.notification.id)
                            }
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )
        ) : (
          <div className="flex flex-col">
            <div className="px-4 py-2 border-b flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-md border transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted hover:bg-muted/70 text-muted-foreground border-transparent",
                    )}
                  >
                    {cat === "ALL"
                      ? "All"
                      : cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </button>
                );
              })}
              <button
                onClick={() => setShowUnreadOnly((v) => !v)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md border transition-colors",
                  showUnreadOnly
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted hover:bg-muted/70 text-muted-foreground border-transparent",
                )}
              >
                {showUnreadOnly ? "Unread" : "All status"}
              </button>
            </div>
            {centerItems.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                No notifications match.
              </div>
            ) : (
              <ScrollArea className="max-h-[420px]">
                <ul className="divide-y">
                  {centerItems.map((n) => {
                    const category = n.notification.category || null;
                    const rawUrl = n.notification.actionUrl;
                    const safeUrl =
                      rawUrl && n.notification.category === "HOUSE"
                        ? "/invite"
                        : rawUrl;
                    return (
                      <li
                        key={n.notification.id}
                        className={cn(
                          "px-4 py-3 flex gap-3 transition-colors border-l-2",
                          getLevelColor(n.notification.level),
                          !n.isRead
                            ? "bg-background hover:bg-accent/40"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <div className="mt-0.5">{categoryIcon(category)}</div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm font-medium",
                                  !n.isRead && "text-foreground",
                                )}
                              >
                                {n.notification.title}
                              </p>
                              {n.notification.body && (
                                <p className="text-xs text-muted-foreground whitespace-pre-line">
                                  {n.notification.body}
                                </p>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 pt-1">
                            {!n.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  markOne(n.id || n.notification.id)
                                }
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              >
                                Mark
                              </Button>
                            )}
                            {safeUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpen(n, safeUrl)}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              >
                                Open
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                dismissOne(n.id || n.notification.id)
                              }
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </div>
        )}
        <Separator />
        <div className="px-4 py-2 text-[11px] text-muted-foreground flex justify-between items-center">
          <span>{unreadCount} unread</span>
          <div className="flex items-center gap-3">
            {!showCenter && (
              <a href="/notifications" className="underline hover:no-underline">
                View all
              </a>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
