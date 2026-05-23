import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const parseLimit = (value: string | null) => {
  const limit = Number(value ?? 30);

  if (!Number.isFinite(limit)) {
    return 30;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 100);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  const limit = parseLimit(searchParams.get("limit"));

  const traces = await prisma.toolCallTrace.findMany({
    where: conversationId ? { conversationId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      conversationId: true,
      skillId: true,
      skillName: true,
      toolName: true,
      role: true,
      args: true,
      result: true,
      status: true,
      latencyMs: true,
      errorMessage: true,
      createdAt: true,
    },
  });

  return Response.json(
    traces.map((trace) => ({
      ...trace,
      createdAt: trace.createdAt.toISOString(),
    })),
  );
}
