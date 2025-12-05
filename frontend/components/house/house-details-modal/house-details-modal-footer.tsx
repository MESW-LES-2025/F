import { AlertCircle, TrashIcon } from "lucide-react";
import { HouseDetails } from "../../../lib/types";
import { useHouse } from "@/lib/house-context";
import { useState } from "react";

interface HouseDetailsHeaderProps {
  editing: boolean;
  houseData: HouseDetails;
  currentUserAdmin: boolean;
  setOpenCriticalModalDelete: (openCriticalModalDelete: boolean) => void;
  onOpenChange: (open: boolean) => void;
}

export function HouseDetailsFooter({
  editing,
  houseData,
  currentUserAdmin,
  setOpenCriticalModalDelete,
  onOpenChange,
}: HouseDetailsHeaderProps) {
  const { setSelectedHouse } = useHouse();
  const [hover, setHover] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          {currentUserAdmin && editing && houseData.users.length <= 1 && (
            <button
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => {
                setOpenCriticalModalDelete(true);
              }}
            >
              {hover ? (
                <AlertCircle className="w-5 h-5 text-red-600 cursor-pointer" />
              ) : (
                <TrashIcon className="w-5 h-5 text-red-600 cursor-pointer" />
              )}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-blue-300 hover:bg-blue-400 transition cursor-pointer"
            onClick={() => setSelectedHouse(houseData.house)}
          >
            <a href="/">Go to house</a>
          </button>

          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
