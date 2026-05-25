import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  hashToken,
} from "@/lib/auth/refresh-token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const refreshToken = getRefreshTokenFromRequest(request);

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  const response = NextResponse.json({ success: true });
  clearRefreshTokenCookie(response);

  return response;
}
