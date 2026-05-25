import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import type { Role } from "@/lib/agent/types";
import { hashToken, setRefreshTokenCookie } from "@/lib/auth/refresh-token";
import {
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  signAccessToken,
  signRefreshToken,
  type AuthUser,
} from "@/lib/auth/tokens";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

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
  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "请输入用户名和密码。" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      role: true,
    },
  });

  if (!user) {
    return Response.json({ error: "用户名或密码错误。" }, { status: 401 });
  }

  const passwordValid = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    return Response.json({ error: "用户名或密码错误。" }, { status: 401 });
  }

  const authUser = toAuthUser(user);
  const accessToken = signAccessToken(authUser);
  const refreshToken = signRefreshToken(authUser);
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000,
  );

  await prisma.refreshToken.create({
    data: {
      userId: authUser.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  const response = NextResponse.json({
    accessToken,
    user: authUser,
  });

  setRefreshTokenCookie(response, refreshToken);

  return response;
}
