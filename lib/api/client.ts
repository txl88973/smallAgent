"use client";

import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { getStoredAccessToken, useAuthStore } from "@/lib/auth/auth-store";
import type { AuthUser } from "@/lib/auth/tokens";

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type QueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let pendingQueue: QueueItem[] = [];

export const refreshClient = axios.create({
  baseURL: "",
  withCredentials: true,
});

export const apiClient = axios.create({
  baseURL: "",
  withCredentials: true,
});

const redirectToLogin = () => {
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/login"
  ) {
    window.location.assign("/login");
  }
};

const processQueue = (error: unknown, token?: string) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  pendingQueue = [];
};

export const refreshAccessToken = async () => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const response = await refreshClient.post<AuthResponse>("/api/auth/refresh");
    const { accessToken, user } = response.data;

    useAuthStore.getState().setAuth(accessToken, user);
    processQueue(null, accessToken);

    return accessToken;
  } catch (error) {
    useAuthStore.getState().clearAuth();
    processQueue(error);
    redirectToLogin();
    throw error;
  } finally {
    isRefreshing = false;
  }
};

apiClient.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      throw error;
    }

    if (originalRequest._retry) {
      useAuthStore.getState().clearAuth();
      redirectToLogin();
      throw error;
    }

    originalRequest._retry = true;

    const accessToken = await refreshAccessToken();
    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

    return apiClient(originalRequest) as Promise<AxiosResponse>;
  },
);

export const authFetch: typeof fetch = async (input, init = {}) => {
  const buildInit = (accessToken: string | null): RequestInit => {
    const headers = new Headers(init.headers);

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return {
      ...init,
      credentials: init.credentials ?? "same-origin",
      headers,
    };
  };

  let response = await fetch(input, buildInit(getStoredAccessToken()));

  if (response.status !== 401) {
    return response;
  }

  const accessToken = await refreshAccessToken();
  response = await fetch(input, buildInit(accessToken));

  return response;
};
