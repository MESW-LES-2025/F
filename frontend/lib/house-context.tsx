'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { houseService } from './house-service';
import type { House } from './types';

interface HouseContextType {
  selectedHouse: House | null;
  houses: House[];
  isLoading: boolean;
  setSelectedHouse: (house: House | null) => void;
  refreshHouses: () => Promise<void>;
}

const HouseContext = createContext<HouseContextType | undefined>(undefined);

const SELECTED_HOUSE_KEY = 'selectedHouseId';

export function HouseProvider({ children }: { children: ReactNode }) {
  const [selectedHouse, setSelectedHouseState] = useState<House | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load houses on mount
  useEffect(() => {
    loadHouses();
  }, []);

  // Restore last selected house from localStorage after houses are loaded
  useEffect(() => {
    if (houses.length > 0 && !selectedHouse) {
      const savedHouseId = localStorage.getItem(SELECTED_HOUSE_KEY);
      
      if (savedHouseId) {
        const savedHouse = houses.find(h => h.id === savedHouseId);
        if (savedHouse) {
          setSelectedHouseState(savedHouse);
          return;
        }
      }
      
      // If no saved house or saved house not found, default to first house
      setSelectedHouseState(houses[0]);
    }
  }, [houses, selectedHouse]);

  const loadHouses = async () => {
    try {
      setIsLoading(true);
      const fetchedHouses = await houseService.findAllUserHouses();
      setHouses(fetchedHouses);
    } catch (error) {
      console.error('Failed to load houses:', error);
      setHouses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedHouse = (house: House | null) => {
    setSelectedHouseState(house);
    
    // Persist to localStorage
    if (house) {
      localStorage.setItem(SELECTED_HOUSE_KEY, house.id);
    } else {
      localStorage.removeItem(SELECTED_HOUSE_KEY);
    }
  };

  const refreshHouses = async () => {
    await loadHouses();
  };

  return (
    <HouseContext.Provider
      value={{
        selectedHouse,
        houses,
        isLoading,
        setSelectedHouse,
        refreshHouses,
      }}
    >
      {children}
    </HouseContext.Provider>
  );
}

export function useHouse() {
  const context = useContext(HouseContext);
  if (context === undefined) {
    throw new Error('useHouse must be used within a HouseProvider');
  }
  return context;
}
