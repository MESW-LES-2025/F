import { houseService } from "@/lib/house-service";
import { Crown, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HouseDetails, User as UserType } from "../../lib/types";
import { useAuth } from "@/lib/auth-context";
import { CriticalActionModal } from "../shared/modal/critical-action-modal";
import { HouseDetailsHeader } from "./house-details-modal/house-details-modal-header";
import { HouseDetailsFooter } from "./house-details-modal/house-details-modal-footer";

interface HouseDetailsModalProps {
  open: boolean;
  houseId: string;
  onOpenChange: (open: boolean) => void;
}

export function HouseDetailsModal({
  open,
  houseId,
  onOpenChange,
}: HouseDetailsModalProps) {
  const [houseData, setHouseData] = useState<HouseDetails | null>(null);
  const [currentUserAdmin, setCurrentUserAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newHouseName, setNewHouseName] = useState<string>("");
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const [selectedUserToDelete, setSelectedUserToDelete] =
    useState<UserType | null>(null);
  const [selectedUserToUpgrade, setSelectedUserToUpgrade] =
    useState<UserType | null>(null);
  const [openCriticalModalRemove, setOpenCriticalModalRemove] = useState(false);
  const [openCriticalModalUpgrade, setOpenCriticalModalUpgrade] =
    useState(false);
  const [openCriticalModalDelete, setOpenCriticalModalDelete] = useState(false);

  const { user } = useAuth();
  const currentUser = user;

  useEffect(() => {
    async function loadData() {
      const data = await houseService.findHouseDetails(houseId);
      setHouseData(data);
      setNewHouseName(data.house.name);

      // Verify if current user is a admin
      data.users.map((user) => {
        if (
          user.houses[0].role == "ADMIN" &&
          user.email == currentUser?.email
        ) {
          setCurrentUserAdmin(true);
        }
      });
    }

    if (open) {
      loadData();
    }
  }, [open, houseId]);

  if (!open || !houseData) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
        {/* Header */}
        <HouseDetailsHeader
          editing={editing}
          setEditing={setEditing}
          newHouseName={newHouseName}
          setNewHouseName={setNewHouseName}
          houseData={houseData}
          setHouseData={setHouseData}
          currentUserAdmin={currentUserAdmin}
        />

        {/* Users List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Users in this house</h3>
          <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {houseData.users.map((user, index) => (
              <li
                key={index}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  {/* If user don't have image, use the first letter of name + random background color */}
                  {user.imagePublicId ? (
                    <img
                      src={`https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_face,h_100,w_100/${user.imagePublicId}.jpg`}
                      alt={user.name}
                      className="rounded-full w-10 h-10 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-400  flex items-center justify-center text-white font-bold text-lg">
                      {user.name[0].toUpperCase()}
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-gray-500">
                        @{user.username}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {user.houses[0]?.role || "Member"}
                  </span>

                  {currentUserAdmin &&
                    editing &&
                    user.email !== currentUser?.email &&
                    user.houses[0].role !== "ADMIN" && (
                      <button
                        className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition"
                        onClick={() => {
                          setSelectedUserToDelete(user);
                          setOpenCriticalModalRemove(true);
                        }}
                      >
                        <Minus className="text-red-600 w-4 h-4" />
                      </button>
                    )}

                  {currentUserAdmin &&
                    editing &&
                    user.email !== currentUser?.email &&
                    user.houses[0].role !== "ADMIN" && (
                      <button
                        className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition"
                        onClick={() => {
                          setSelectedUserToUpgrade(user);
                          setOpenCriticalModalUpgrade(true);
                        }}
                      >
                        <Crown className="text-blue-600 w-4 h-4" />
                      </button>
                    )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <HouseDetailsFooter
          editing={editing}
          houseData={houseData}
          currentUserAdmin={currentUserAdmin}
          setOpenCriticalModalDelete={setOpenCriticalModalDelete}
          onOpenChange={onOpenChange}
        />
      </div>

      <CriticalActionModal
        open={openCriticalModalRemove}
        onOpenChange={setOpenCriticalModalRemove}
        actionText="Remove"
        text={`Are you sure you want to remove ${selectedUserToDelete?.name} from the house ${houseData?.house.name}?  This action can't be undone!`}
        onAction={async () => {
          try {
            if (!selectedUserToDelete) return;

            const response = await houseService.update(houseData.house.id, {
              userToRemoveId: selectedUserToDelete.id,
            });

            if (response.id) {
              setHouseData({
                ...houseData,
                users: houseData.users.filter(
                  (u) => u.id !== selectedUserToDelete.id
                ),
              });
            }
          } catch (err) {
            console.error("Could not remove user: ", err);
          }
        }}
      />

      <CriticalActionModal
        open={openCriticalModalUpgrade}
        onOpenChange={setOpenCriticalModalUpgrade}
        actionText="Upgrade"
        text={`Are you sure you want to upgrade ${selectedUserToUpgrade?.name} to Admin? This action can't be undone!`}
        onAction={async () => {
          try {
            if (!selectedUserToUpgrade) return;

            const response = await houseService.update(houseData.house.id, {
              userToUpgradeId: selectedUserToUpgrade.id,
            });

            if (response.id) {
              setHouseData({
                ...houseData,
                users: houseData.users.map((user) =>
                  user.id === selectedUserToUpgrade.id
                    ? {
                        ...user,
                        houses: [
                          {
                            ...user.houses[0],
                            role: "ADMIN",
                          },
                        ],
                      }
                    : user
                ),
              });

              setOpenCriticalModalUpgrade(false);
            }
          } catch (err) {
            console.error("Could not upgrade user: ", err);
          }
        }}
      />

      <CriticalActionModal
        open={openCriticalModalDelete}
        onOpenChange={setOpenCriticalModalDelete}
        actionText="Delete"
        text={`Are you sure you want to delete ${houseData.house?.name}? This action can't be undone!`}
        onAction={async () => {
          try {
            const response = await houseService.delete(houseData.house.id);

            if (response.id) {
              setOpenCriticalModalUpgrade(false);
              window.location.reload();
            }
          } catch (err) {
            console.error("Could not delete the house: ", err);
          }
        }}
      />
    </div>,
    document.body
  );
}
