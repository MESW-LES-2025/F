import { apiDelete, apiGet, apiPost, apiPut } from "./api-client";
import { House, HouseDetails } from "./types";

export interface JoinHousePayload {
  name: string;
}

export interface UpdateHousePayload {
  name?: string;
  userToRemoveId?: string;
  userToUpgradeId?: string;
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

  /**
   * Find a house details
   */
  async findHouseDetails(id: string): Promise<HouseDetails> {
    const house = await apiGet<HouseDetails>(`/house/details/${id}`, {
      requiresAuth: true,
    });

    return house;
  }

  /**
   * Update a house.
   */
  async update(id: string, houseData: UpdateHousePayload): Promise<House> {
    const house = await apiPut<House>(`/house/${id}`, houseData, {
      requiresAuth: true,
    });

    return house;
  }

  /**
   * Delete a house.
   */
  async delete(id: string): Promise<House> {
    const house = await apiDelete<House>(`/house/${id}`, {
      requiresAuth: true,
    });

    return house;
  }
}

export const houseService = new HouseService();
