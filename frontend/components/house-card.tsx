import { House } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { HouseIcon } from "lucide-react";

interface HouseCardProps {
  house: House;
}

export function HouseCard({ house }: HouseCardProps) {
  return (
    <Card className="p-4 bg-white border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <HouseIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{house.name}</p>
          <p className="text-xs text-gray-600">
            Invite friends with the code: {house.invitationCode}
          </p>
        </div>
      </div>
    </Card>
  );
}
