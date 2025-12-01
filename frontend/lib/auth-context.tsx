'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from './auth-service';
import type { AuthResponse, User } from './types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, username: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on mount and check token validity
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to fetch profile to verify if we have valid HttpOnly cookies
        const { apiGet } = await import('./api-client');
        const profileData = await apiGet('/user', { requiresAuth: true });
        
        // Token is valid and profile retrieved
        setUser(profileData as User);
        setIsAuthenticated(true);
        
        // Update cached user in sessionStorage
        sessionStorage.setItem('user', JSON.stringify(profileData));
      } catch (error) {
        // Profile fetch failed, user not authenticated
        // We don't need to check for tokens manually anymore as they are HttpOnly
        setIsAuthenticated(false);
        sessionStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      // Store user in sessionStorage for quick access
      sessionStorage.setItem('user', JSON.stringify(response.user));

      return response
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await authService.register(email, username, password, name);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      sessionStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAllDevices = async () => {
    setIsLoading(true);
    try {
      await authService.logoutAllDevices();
      setUser(null);
      setIsAuthenticated(false);
      sessionStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('user', JSON.stringify(updated));
    } catch (e) {
      // ignore session storage errors
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    changePassword,
    logoutAllDevices,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
