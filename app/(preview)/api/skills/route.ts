import { getSkillPanelData } from "@/lib/agent/skill-registry";
import type { Role } from "@/lib/agent/types";

export const runtime = "nodejs";

const parseRole = (value: string | null): Role => {
  return value === "admin" ? "admin" : "user";
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = parseRole(searchParams.get("role"));
  const skills = await getSkillPanelData(role);

  return Response.json(skills);
}
