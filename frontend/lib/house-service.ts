import { apiGet, apiPost } from "./api-client";
import { House } from "./types";

export interface JoinHousePayload {
  name: string;
}

class HouseService {
  /**
   * Create a new house.
   */
  async create(houseData: JoinHousePayload): Promise<House> {
    const house = await apiPost<House>("/house", houseData, {
      requiresAuth: true,
    });

    return house;
  }

  /**
   * Find all houses in the system related to the user
   */
  async findAllUserHouses(): Promise<House[]> {
    const house = await apiGet<House[]>("/house/user", {
      requiresAuth: true,
    });

    return house;
  }

  /**
   * Find a specific house
   */
  async findOne(id: string): Promise<House> {
    const house = await apiGet<House>(`/house/${id}`, {
      requiresAuth: true,
    });

    return house;
  }
}

export const houseService = new HouseService();
