import { House } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { DoorClosed, DoorOpen, HouseIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { userService } from "@/lib/user-service";
import { CriticalActionModal } from "../shared/modal/critical-action-modal";
import { SuccessActionModal } from "../shared/modal/success-modal";
import { useHouse } from "@/lib/house-context";
import { useRouter } from "next/navigation";

interface HouseCardProps {
  house: House;
  from: "login" | "management";
}

export function HouseCard({ house, from }: HouseCardProps) {
  const [hover, setHover] = useState(false);
  const [openCriticalModal, setOpenCriticalModal] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [housesLenBefore, setHousesLenBefore] = useState(0);
  const { setSelectedHouse, houses } = useHouse();
  const router = useRouter();

  return (
    <Card className="p-4 bg-white border border-gray-200 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <Link
          onClick={() => setSelectedHouse(house)}
          href={`/`}
          className="flex-1 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <HouseIcon className="w-5 h-5 text-blue-600" />
          </div>

          <div>
            <p className="text-2xl font-bold text-gray-900">{house.name}</p>
            <p className="text-xs text-gray-600">
              Invite friends with the code: {house.invitationCode}
            </p>
          </div>
        </Link>

        {from == "management" && (
          <div
            className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center cursor-pointer"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenCriticalModal(true);
            }}
          >
            {hover ? (
              <DoorOpen className="w-5 h-5 text-red-600" />
            ) : (
              <DoorClosed className="w-5 h-5 text-red-600" />
            )}
          </div>
        )}
      </div>

      <CriticalActionModal
        open={openCriticalModal}
        onOpenChange={setOpenCriticalModal}
        actionText="Leave"
        text={`Are you sure you want to leave house ${house.name}?`}
        onAction={async () => {
          try {
            setHousesLenBefore(houses.length);

            const response = await userService.leaveHouse({
              houseId: house.id,
            });

            if (response.id) {
              setOpenSuccessModal(true);
            }
          } catch (err) {
            console.error("Could not load houses: ", err);
          }
        }}
      />
      <SuccessActionModal
        open={openSuccessModal}
        onOpenChange={(open) => {
          setOpenSuccessModal(open);
          if (!open) {
            if (housesLenBefore > 1) {
              window.location.reload();
            } else {
              router.push("/join-house");
            }
          }
        }}
        text={`You have successfully left house ${house.name}`}
      />
    </Card>
  );
}
