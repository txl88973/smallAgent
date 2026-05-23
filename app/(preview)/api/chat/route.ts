import { buildSystemPrompt } from "@/lib/agent/prompt";
import { getEnabledSkills, getVisibleTools } from "@/lib/agent/skill-registry";
import { toAiSdkTools } from "@/lib/agent/tool-adapter";
import type { Role } from "@/lib/agent/types";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "nodejs";

const qwen = createOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export async function POST(request: Request) {
  const body = await request.json();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const role: Role = body.role === "admin" ? "admin" : "user";
  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId : undefined;
  const enabledSkills = await getEnabledSkills(role);
  const visibleTools = await getVisibleTools(role);

  const stream = streamText({
    model: qwen("qwen-plus"),
    system: buildSystemPrompt({ role, skills: enabledSkills }),
    messages,
    maxSteps: 5,
    tools: toAiSdkTools(visibleTools, { role, conversationId }),
  });

  return stream.toDataStreamResponse({
    getErrorMessage: (error) => {
      console.error("AI stream error:", error);

      if (error instanceof Error) {
        return error.message;
      }

      return String(error);
    },
  });
}
