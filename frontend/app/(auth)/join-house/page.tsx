"use client";

import { JoinHouseForm } from "@/components/house/house-join-form";
import { CreateHouseForm } from "@/components/house/house-create-form";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function JoinHousePage() {
  const router = useRouter();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="space-y-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Join a house!
          </h1>
          <p className="text-muted-foreground">
            Create a new house or join an existing one
          </p>
        </div>

        <div>
          <Button
            onClick={() => router.push("/settings-without-house")}
            className="inline-flex items-center text-sm transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <JoinHouseForm isRegister={true} />

        <CreateHouseForm isRegister={true} />
      </div>
    </div>
  );
}
