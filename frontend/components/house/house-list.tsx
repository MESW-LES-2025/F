import { House } from "@/lib/types";
import { HouseCard } from "./house-card";

interface HouseListProps {
  houses: House[];
}

export function HouseList({ houses }: HouseListProps) {
  if (!houses.length) {
    return <div>Could not find houses</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {houses.map((house) => (
        <HouseCard key={house.id} house={house} />
      ))}
    </div>
  );
}

