"use client";

import { useHouse } from "@/lib/house-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ProfileScroll() {
  const { selectedHouse } = useHouse();

  if (!selectedHouse || !selectedHouse.users) {
    return null;
  }

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider shrink-0">
            Household
          </span>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max p-1 pl-2">
              {selectedHouse.users.map(({ user }) => (
                <div
                  key={user.id}
                  className="group relative -ml-3 first:ml-0 hover:z-10 transition-all duration-200 ease-in-out hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover:ring-primary transition-all">
                      <AvatarImage src={user.imageUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {user.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-600 font-medium bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100 pointer-events-none whitespace-nowrap z-20">
                      {user.name?.split(" ")[0] || user.username || "User"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
