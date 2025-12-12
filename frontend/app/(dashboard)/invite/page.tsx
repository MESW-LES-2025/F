"use client";

import { useCallback, useEffect, useState } from "react";
import { InviteSendCard } from "@/components/invite/invite-send-card";
import { Card } from "@/components/ui/card";
import { InviteInbox } from "@/components/invite/invite-inbox";
import { houseService } from "@/lib/house-service";
import { House } from "@/lib/types";

export default function InvitePage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHouses = useCallback(async () => {
    setLoading(true);
    try {
      const userHouses = await houseService.findAllUserHouses();
      setHouses(userHouses);
      setSelectedHouseId((current) => current ?? userHouses[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHouses();
  }, [loadHouses]);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Invite people
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a house and invite a registered user.
        </p>
      </div>

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Loading your houses...
        </Card>
      ) : houses.length === 0 ? (
        <Card className="p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium">No houses yet</p>
            <p className="text-sm text-muted-foreground">
              Create or join a house to start inviting others.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <InviteSendCard
            houses={houses}
            selectedHouseId={selectedHouseId}
            onHouseChange={setSelectedHouseId}
          />
          <InviteInbox onRefreshHouses={loadHouses} />
        </div>
      )}
    </div>
  );
}
