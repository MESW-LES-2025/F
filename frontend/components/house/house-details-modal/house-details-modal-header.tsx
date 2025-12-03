import { houseService } from "@/lib/house-service";
import { Pencil, Check, House } from "lucide-react";
import { HouseDetails } from "../../../lib/types";

interface HouseDetailsHeaderProps {
  editing: boolean;
  setEditing: (editing: boolean) => void;
  newHouseName: string;
  setNewHouseName: (newHouseName: string) => void;
  houseData: HouseDetails;
  setHouseData: (houseData: HouseDetails) => void;
  currentUserAdmin: boolean;
}

export function HouseDetailsHeader({
  editing,
  setEditing,
  newHouseName,
  setNewHouseName,
  houseData,
  setHouseData,
  currentUserAdmin,
}: HouseDetailsHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <House className="text-blue-600 w-6 h-6" />
        {currentUserAdmin ? (
          editing ? (
            <input
              value={newHouseName}
              onChange={(e) => setNewHouseName(e.target.value)}
              className="border-b border-gray-400 text-2xl font-bold focus:outline-none"
            />
          ) : (
            <h2 className="text-2xl font-bold">{houseData.house.name}</h2>
          )
        ) : (
          <h2 className="text-2xl font-bold">{houseData.house.name}</h2>
        )}

        {currentUserAdmin &&
          (editing ? (
            <button
              onClick={async () => {
                try {
                  await houseService.update(houseData.house.id, {
                    name: newHouseName,
                  });
                  setHouseData({
                    ...houseData,
                    house: { ...houseData.house, name: newHouseName },
                  });
                  setEditing(false);
                } catch (err) {
                  console.error("Error updating house name:", err);
                }
              }}
              className="text-blue-600 w-6 h-6"
            >
              <Check className="text-blue-600 w-6 h-6 cursor-pointer" />
            </button>
          ) : (
            <Pencil
              className="text-blue-600 w-5 h-6 cursor-pointer"
              onClick={() => setEditing(true)}
            />
          ))}
      </div>
      <div>
        <p className="text-gray-600">
          Created in: {new Date(houseData.house.createdAt).toLocaleDateString()}{" "}
          | Last updated:{" "}
          {new Date(houseData.house.updatedAt).toLocaleDateString()}
        </p>
        <p className="mb-4 text-gray-600">
          Invite code:{" "}
          <span className="font-semibold">
            {houseData.house.invitationCode}
          </span>{" "}
        </p>
      </div>
    </>
  );
}
