import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { House } from "@/lib/types";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useState } from "react";

interface DashboardHeaderProps {
  currentHouse: House | null;
  userHouses: House[] | null;
  router: AppRouterInstance;
}

export function DashboardHeader({
  currentHouse = null,
  userHouses = null,
  router,
}: DashboardHeaderProps) {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(
    currentHouse
  );

  const handleSelectHouse = (houseId: string) => {
    const house = userHouses?.find((h) => h.id === houseId) || null;
    setSelectedHouse(house);
    if (house) router.push(`/?houseId=${house.id}`);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 relative">
          <h1 className="text-base md:text-lg font-semibold text-gray-900">
            {selectedHouse?.name || "House not identified"}
          </h1>
          <Select
            value={selectedHouse?.id || ""}
            onValueChange={handleSelectHouse}
          >
            <SelectTrigger className="w-5 h-5 p-0 border-none bg-transparent shadow-none"></SelectTrigger>
            
            <SelectContent>
              {userHouses?.map((house) => (
                <SelectItem key={house.id} value={house.id}>
                  {house.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-sm bg-transparent w-full sm:w-auto"
        >
          + New Activity
        </Button>
      </div>

      <div className="px-4 md:px-6 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">
            Timeframe:
          </span>
          <Select defaultValue="last-month">
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-week">Last Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">
            People:
          </span>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="joana">Joana Maria</SelectItem>
              <SelectItem value="marcos">Marcos Salgado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">
            Category:
          </span>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="groceries">Groceries</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
