import type { User } from "./types";
import { apiGet, apiPost, apiUpload } from "./api-client";
import { apiDelete } from "./api-client";
import { apiPatch } from "./api-client";

export interface JoinHousePayload {
  inviteCode: string;
}

export interface JoinHouseResponse {
  houseId: string | null;
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
}

export const userService = new UserService();
