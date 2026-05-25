import prisma from "@/lib/prisma";
import type { Role } from "@/lib/agent/types";

import { verifyAccessToken, type AuthUser } from "./tokens";

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const isRole = (role: string): role is Role => {
  return role === "admin" || role === "user";
};

const toAuthUser = (user: {
  id: string;
  username: string;
  role: string;
}): AuthUser => {
  if (!isRole(user.role)) {
    throw new AuthError(403, "Invalid user role.");
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
};

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
};

export async function getCurrentUserFromRequest(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return user ? toAuthUser(user) : null;
  } catch {
    return null;
  }
}

export async function requireUser(request: Request) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    throw new AuthError(401, "Unauthorized.");
  }

  return user;
}

export async function requireRole(request: Request, allowedRoles: Role[]) {
  const user = await requireUser(request);

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(403, "Forbidden.");
  }

  return user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  throw error;
}
