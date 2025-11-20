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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send the invite.";
      toast({
        title: "Invite failed",
        description: message,
        variant: "destructive",
      });
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
            onChange={(event) => setEmail(event.target.value)}
            placeholder="friend@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="invite-username">Username</Label>
          <Input
            id="invite-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="housemate"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          The recipient must have an account and not already belong to the house.
        </p>
        <Button onClick={handleInvite} disabled={isSending}>
          {isSending ? "Sending..." : "Send Invite"}
        </Button>
      </div>
    </Card>
  );
}
