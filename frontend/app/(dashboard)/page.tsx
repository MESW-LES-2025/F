import { DashboardHeader } from "@/components/dashboard-header";
import { MetricsCards } from "@/components/metrics-cards";
import { ActivitiesBoard } from "@/components/activities-board";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { House } from "@/lib/types";
import { houseService } from "@/lib/house-service";

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentHouse, setCurrentHouse] = useState<House | null>(null);
  const [userHouses, setUserHouses] = useState<House[] | null>(null);
  const [loadingHouse, setLoadingHouse] = useState(false);

  useEffect(() => {
    const fetchHouse = async () => {
      const houseId = searchParams.get("houseId");
      if (!houseId) return;

      setLoadingHouse(true);
      try {
        const data = await houseService.findAllUserHouses();
        const currentHouse =
          data.find((house) => house.id == houseId) ?? data[0];
        setCurrentHouse(currentHouse);
        setUserHouses(data);
      } catch (err) {
        console.error("Failed to fetch houses: ", err);
      } finally {
        setLoadingHouse(false);
      }
    };

    fetchHouse();
  }, [searchParams]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <DashboardHeader currentHouse={currentHouse} userHouses={userHouses} router={router} />
      <MetricsCards />
      <ActivitiesBoard />
    </div>
  );
}
