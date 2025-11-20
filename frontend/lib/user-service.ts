import { apiPost } from "./api-client";

export interface JoinHousePayload {
  inviteCode: string;
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

  async inviteUserToHouse(payload: InviteUserPayload): Promise<void> {
    await apiPost("/user/invite", payload, { requiresAuth: true });
  }
}

export const userService = new UserService();
