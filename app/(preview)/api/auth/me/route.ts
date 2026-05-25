import { authErrorResponse, requireUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return Response.json({ user });
  } catch (error) {
    return authErrorResponse(error);
  }
}
