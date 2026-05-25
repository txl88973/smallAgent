import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import type { Role } from "@/lib/agent/types";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  hashToken,
  setRefreshTokenCookie,
} from "@/lib/auth/refresh-token";
import {
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AuthUser,
} from "@/lib/auth/tokens";

export const runtime = "nodejs";

const unauthorized = () => {
  const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  clearRefreshTokenCookie(response);
  return response;
};

const toAuthUser = (user: {
  id: string;
  username: string;
  role: string;
}): AuthUser => ({
  id: user.id,
  username: user.username,
  role: user.role === "admin" ? "admin" : ("user" satisfies Role),
});

export async function POST(request: Request) {
  const refreshToken = getRefreshTokenFromRequest(request);

  if (!refreshToken) {
    return unauthorized();
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      return unauthorized();
    }

    const authUser = toAuthUser(tokenRecord.user);
    const accessToken = signAccessToken(authUser);
    const nextRefreshToken = signRefreshToken(authUser);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000,
    );

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: authUser.id,
          tokenHash: hashToken(nextRefreshToken),
          expiresAt,
        },
      }),
    ]);

    const response = NextResponse.json({
      accessToken,
      user: authUser,
    });

    setRefreshTokenCookie(response, nextRefreshToken);

    return response;
  } catch {
    return unauthorized();
  }
}
