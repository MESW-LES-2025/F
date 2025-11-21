"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { houseService } from "@/lib/house-service";
import { notificationService } from "@/lib/notification-service";
import { UserNotification } from "@/lib/types";
import { userService } from "@/lib/user-service";
import { Check, Inbox, Loader2, RefreshCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface InviteInboxProps {
  onRefreshHouses?: () => Promise<void> | void;
}

export function InviteInbox({ onRefreshHouses }: InviteInboxProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [invites, setInvites] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadInvites = useCallback(
    async (showSkeleton = false) => {
      if (showSkeleton) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        // Fetch read and unread
        const data = await notificationService.list({
          category: "HOUSE",
        });
        // Newest first
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setInvites(sorted);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load invites.";
        toast({
          title: "Could not load invites",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadInvites(true);
  }, [loadInvites]);

  const updateInviteAsRead = (notificationId: string) => {
    setInvites((current) =>
      current.map((item) =>
        item.notification.id === notificationId
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )
    );
  };

  const handleDismiss = async (notificationRowOrNotificationId: string) => {
    setActionId(notificationRowOrNotificationId);
    try {
      await notificationService.dismiss(notificationRowOrNotificationId);
      setInvites((current) => current.filter((item) => !(item.id === notificationRowOrNotificationId || item.notification.id === notificationRowOrNotificationId)));
      toast({
        title: "Invite dismissed",
        description: "You can still join later via invite code if shared.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to dismiss invite.";
      toast({
        title: "Dismiss failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleAccept = async (invite: UserNotification) => {
  const notificationId = invite.id || invite.notification.id;
    const houseId = invite.notification.actionUrl;

    if (!houseId) {
      toast({
        title: "Invite is missing data",
        description: "Ask your house to resend the invite.",
        variant: "destructive",
      });
      return;
    }

    setActionId(notificationId);

    try {
      const house = await houseService.findOne(houseId);
      if (!house.invitationCode) {
        throw new Error("This house does not have an invitation code yet.");
      }

      const joinResult = await userService.joinHouse({
        inviteCode: house.invitationCode,
      });

      if (!joinResult.houseId) {
        throw new Error("Joining the house failed. Please try again later.");
      }

      await notificationService.markAsRead(notificationId);
      // Remove after acceptance
      setInvites((current) =>
        current.filter((item) => item.notification.id !== notificationId)
      );

      toast({
        title: "Welcome to the house",
        description: `You are now part of ${house.name}.`,
      });

      await onRefreshHouses?.();
      router.push(`/?houseId=${joinResult.houseId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept invite.";
      toast({
        title: "Could not join",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Inbox className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">House invites</h2>
            <p className="text-sm text-muted-foreground">
              Accept an invite to join a house or dismiss it for later.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadInvites(false)}
          disabled={loading || refreshing}
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-20 w-full" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          You don’t have any pending invites right now.
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.notification.id}
              className={"rounded-lg border border-border p-4 transition-colors " +
                (invite.isRead
                  ? "bg-muted/40 hover:bg-muted/50"
                  : "bg-card hover:bg-accent/40")}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {invite.notification.title}
                  </p>
                  {invite.notification.body && (
                    <p className="text-sm text-muted-foreground">
                      {invite.notification.body}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Received {new Date(invite.createdAt).toLocaleString()}
                  </p>
                  {invite.isRead && (
                    <p className="text-xs text-green-700 mt-1">
                      Read • Pending action (Dismiss or Accept)
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="secondary"
                    onClick={() => handleDismiss(invite.notification.id)}
                    disabled={actionId === invite.notification.id}
                    aria-label="Dismiss invite"
                  >
                    {actionId === invite.notification.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Dismiss
                  </Button>
                  <Button
                    onClick={() => handleAccept(invite)}
                    disabled={actionId === invite.notification.id}
                    aria-label="Accept invite"
                  >
                    {actionId === invite.notification.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
