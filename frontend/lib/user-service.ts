import { apiDelete, apiPost } from "./api-client";
import { HouseToUser } from "./types";

export interface JoinHousePayload {
  inviteCode: string;
}

export interface LeaveHousePayload {
  houseId: string;
}

export interface JoinHouseResponse {
  houseId: string | null;
}

export interface InviteUserPayload {
  houseId: string;
  email?: string;
  username?: string;
}

class UserService {
  /**
   * Join a house.
   */
  async joinHouse(houseData: JoinHousePayload): Promise<JoinHouseResponse> {
    const userToHouse = await apiPost<JoinHouseResponse>(
      "/user/join-house",
      houseData,
      {
        requiresAuth: true,
      }
    );

    return userToHouse;
  }

  /**
   * Leave a house.
   */
  async leaveHouse(houseData: LeaveHousePayload): Promise<HouseToUser> {
    const deletedHouse = await apiDelete<HouseToUser>(
      `/user/leave-house?houseId=${houseData.houseId}`,
      {
        requiresAuth: true,
      }
    );

    return deletedHouse;
  }

  async inviteUserToHouse(payload: InviteUserPayload): Promise<void> {
    await apiPost("/user/invite", payload, { requiresAuth: true });
  }
}

export const userService = new UserService();
