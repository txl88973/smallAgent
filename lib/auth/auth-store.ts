"use client";

import { create } from "zustand";

import type { AuthUser } from "./tokens";

const ACCESS_TOKEN_KEY = "agenthub_access_token";
const USER_KEY = "agenthub_user";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  clearAuth: () => void;
  hydrateFromStorage: () => void;
};

const readStoredUser = () => {
  const rawUser = window.localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  setAuth: (accessToken, user) => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      accessToken,
      user,
      isAuthenticated: true,
      isHydrated: true,
    });
  },
  clearAuth: () => {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);

    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
  hydrateFromStorage: () => {
    const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    const user = readStoredUser();

    set({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isHydrated: true,
    });
  },
}));

export const getStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    useAuthStore.getState().accessToken ??
    window.localStorage.getItem(ACCESS_TOKEN_KEY)
  );
};
