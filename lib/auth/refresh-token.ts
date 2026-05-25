import { createHash } from "crypto";
import type { NextResponse } from "next/server";

import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "./tokens";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return target ? decodeURIComponent(target.slice(name.length + 1)) : null;
}

export function getRefreshTokenFromRequest(request: Request) {
  return getCookieValue(request, REFRESH_TOKEN_COOKIE_NAME);
}

export function setRefreshTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearRefreshTokenCookie(response: NextResponse) {
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
