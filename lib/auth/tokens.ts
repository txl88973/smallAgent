import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

import type { Role } from "@/lib/agent/types";

export type AuthUser = {
  id: string;
  username: string;
  role: Role;
};

export type AuthTokenPayload = {
  sub: string;
  username: string;
  role: Role;
};

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN = "7d";
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for authentication.`);
  }

  return value;
};

const toPayload = (user: AuthUser): AuthTokenPayload => ({
  sub: user.id,
  username: user.username,
  role: user.role,
});

const verifyRole = (role: unknown): Role => {
  if (role === "admin" || role === "user") {
    return role;
  }

  throw new Error("Invalid token role.");
};

const normalizePayload = (payload: string | jwt.JwtPayload): AuthTokenPayload => {
  if (typeof payload === "string") {
    throw new Error("Invalid token payload.");
  }

  if (typeof payload.sub !== "string" || typeof payload.username !== "string") {
    throw new Error("Invalid token payload.");
  }

  return {
    sub: payload.sub,
    username: payload.username,
    role: verifyRole(payload.role),
  };
};

export function signAccessToken(user: AuthUser) {
  return jwt.sign(toPayload(user), getRequiredEnv("JWT_ACCESS_SECRET"), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function signRefreshToken(user: AuthUser) {
  return jwt.sign(toPayload(user), getRequiredEnv("JWT_REFRESH_SECRET"), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    jwtid: randomUUID(),
  });
}

export function verifyAccessToken(token: string) {
  return normalizePayload(jwt.verify(token, getRequiredEnv("JWT_ACCESS_SECRET")));
}

export function verifyRefreshToken(token: string) {
  return normalizePayload(jwt.verify(token, getRequiredEnv("JWT_REFRESH_SECRET")));
}
