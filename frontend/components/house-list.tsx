import { House } from "@/lib/types";
import { HouseCard } from "./house-card";
import Link from "next/link";

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
        <Link
          key={house.id}
          href={`/?houseId=${house.id}`}
          className="block transform transition duration-300 hover:scale-105 hover:shadow-lg"
        >
          <HouseCard house={house} />
        </Link>
      ))}
    </div>
  );
}
