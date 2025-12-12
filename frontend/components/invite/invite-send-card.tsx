"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api-client";
import { House } from "@/lib/types";
import { userService } from "@/lib/user-service";
import { UserPlus2 } from "lucide-react";

interface InviteSendCardProps {
  houses: House[];
  selectedHouseId: string | null;
  onHouseChange: (houseId: string) => void;
}

export function InviteSendCard({
  houses,
  selectedHouseId,
  onHouseChange,
}: InviteSendCardProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<{
    target: string;
    houseName: string;
  } | null>(null);
  const [inlineNote, setInlineNote] = useState<string | null>(null);
  const [outgoingInvites, setOutgoingInvites] = useState<
    { target: string; houseName: string; at: number }[]
  >([]);

  const selectedHouse = houses.find((h) => h.id === selectedHouseId) || null;
  const canSend =
    !!selectedHouseId &&
    (email.trim().length > 0 || username.trim().length > 0) &&
    !isSending;

  const handleInvite = async () => {
    if (!selectedHouseId) {
      toast({
        title: "Select a house",
        description: "Choose a house before sending an invite.",
        variant: "destructive",
      });
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail && !trimmedUsername) {
      toast({
        title: "Invite needs contact info",
        description: "Enter an email or username to send the invite.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      await userService.inviteUserToHouse({
        houseId: selectedHouseId,
        email: trimmedEmail || undefined,
        username: trimmedUsername || undefined,
      });

      toast({
        title: "Invite sent",
        description: "We let them know about your house.",
      });

      setEmail("");
      setUsername("");
      setInlineNote(null);
      setLastSuccess({
        target: trimmedEmail || `@${trimmedUsername}`,
        houseName: selectedHouse?.name ?? "",
      });
      // Track locally as a recently-sent invite (session only)
      setOutgoingInvites((prev) => {
        const next = [
          {
            target: trimmedEmail || `@${trimmedUsername}`,
            houseName: selectedHouse?.name ?? "",
            at: Date.now(),
          },
          ...prev,
        ];
        // keep last 5
        return next.slice(0, 5);
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const msg = (error.message || "").toLowerCase();
        if (error.status === 400 && msg.includes("already in the house")) {
          setInlineNote("This user is already a member of the selected house.");
        } else if (error.status === 400 && msg.includes("pending invite")) {
          setInlineNote("They already have a pending invite to this house.");
        } else if (
          error.status === 404 ||
          msg.includes("not found") ||
          msg.includes("does not exist") ||
          msg.includes("no user")
        ) {
          // Same inline style as other informative notes
          const notFoundMsg =
            "We couldn’t find that user. Check the email/username.";
          setInlineNote(notFoundMsg);
        } else {
          toast({
            title: "Invite failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        const message =
          error instanceof Error ? error.message : "Failed to send the invite.";
        toast({
          title: "Invite failed",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="space-y-5 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UserPlus2 className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Invite house members</h2>
            <p className="text-sm text-muted-foreground">
              Choose a house and invite a registered user by email or username.
            </p>
          </div>
        </div>
      </div>

      {lastSuccess && (
        <div
          className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900"
          role="status"
          aria-live="polite"
        >
          Invite sent to{" "}
          <span className="font-medium">{lastSuccess.target}</span>
          {lastSuccess.houseName ? (
            <>
              {" "}
              for house{" "}
              <span className="font-medium">{lastSuccess.houseName}</span>.
            </>
          ) : (
            "."
          )}
        </div>
      )}

      {inlineNote && (
        <div
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          role="status"
          aria-live="polite"
        >
          {inlineNote}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="invite-house">House</Label>
          <Select
            value={selectedHouseId ?? ""}
            onValueChange={(value) => onHouseChange(value)}
          >
            <SelectTrigger id="invite-house">
              <SelectValue placeholder="Select a house" />
            </SelectTrigger>
            <SelectContent>
              {houses.map((house) => (
                <SelectItem key={house.id} value={house.id}>
                  {house.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setInlineNote(null);
            }}
            placeholder="friend@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="invite-username">Username</Label>
          <Input
            id="invite-username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setInlineNote(null);
            }}
            placeholder="housemate"
          />
        </div>
        <div className="sm:col-span-2 -mt-1">
          <p className="text-xs text-muted-foreground">
            Email or username - only one is required.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          The recipient must have an account and not already belong to the
          house.
        </p>
        <div className="flex items-center gap-2">
          {selectedHouse?.invitationCode && (
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    selectedHouse.invitationCode,
                  );
                  toast({
                    title: "Invite code copied",
                    description: "Share it with your friend to join.",
                  });
                } catch {
                  toast({
                    title: "Could not copy",
                    description: selectedHouse.invitationCode,
                  });
                }
              }}
            >
              Copy invite code
            </Button>
          )}
          <Button
            onClick={handleInvite}
            disabled={!canSend}
            aria-disabled={!canSend}
          >
            {isSending ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </div>

      {outgoingInvites.length > 0 && (
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-2 text-sm font-medium">Recently sent invites</div>
          <ul className="space-y-1 text-sm">
            {outgoingInvites.map((o, idx) => (
              <li
                key={`${o.at}-${idx}`}
                className="flex items-center justify-between"
              >
                <span>
                  To <span className="font-medium">{o.target}</span>
                  {o.houseName ? (
                    <>
                      {" "}
                      for <span className="font-medium">{o.houseName}</span>
                    </>
                  ) : null}{" "}
                  at {new Date(o.at).toLocaleTimeString()}
                </span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() =>
                    setOutgoingInvites((prev) =>
                      prev.filter((x) => x.at !== o.at),
                    )
                  }
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
