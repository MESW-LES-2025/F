import { HouseCard } from "./house-card";
import { useHouse } from "@/lib/house-context";

interface HouseListProps {
  from: "login" | "management";
}

export function HouseList({ from }: HouseListProps) {
  const { houses } = useHouse();

  if (!houses.length) {
    return <div>Could not find houses</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {houses.map((house) => (
        <HouseCard key={house.id} house={house} from={from} />
      ))}
    </div>
  );
}
