import { buildSystemPrompt } from "@/lib/agent/prompt";
import { getEnabledSkills, getVisibleTools } from "@/lib/agent/skill-registry";
import { toAiSdkTools } from "@/lib/agent/tool-adapter";
import type { Role } from "@/lib/agent/types";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// 这个 Route Handler 会用 Prisma / 数据库 / 服务端环境变量。
// 明确指定 nodejs runtime，避免被 Next.js 放到 Edge Runtime 后缺少 Node 能力。
export const runtime = "nodejs";

// DashScope 提供 OpenAI-compatible API。
// Vercel AI SDK 的 @ai-sdk/openai provider 可以直接接这类兼容接口，
// 所以这里不用单独引入 DashScope 专用 SDK。
const qwen = createOpenAI({
  // 这段代码运行在服务端，可以安全读取环境变量；
  // 不要在带 "use client" 的前端组件里读取模型 API Key。
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

// Next.js App Router 的 API 写法。
// 文件路径 app/(preview)/api/chat/route.ts 对应接口 POST /api/chat。
// useChat 默认会把对话历史发送到这个接口。
export async function POST(request: Request) {
  // 前端 useChat 发送的 body 通常包含：
  // {
  //   messages: [...],
  //   role: "user" | "admin",
  //   conversationId?: string
  // }
  const body = await request.json();

  // messages 是模型需要的上下文历史。
  // 这里做一层兜底，避免请求体异常时把非数组传给 AI SDK。
  const messages = Array.isArray(body.messages) ? body.messages : [];

  // role 决定后端暴露哪些 Skill / Tool。
  // 非 admin 一律按 user 处理，避免前端传入非法 role 绕过权限。
  const role: Role = body.role === "admin" ? "admin" : "user";

  // conversationId 当前是可选的。
  // 如果传入，后续 Tool Trace 会按这个会话 ID 关联记录。
  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId : undefined;

  // Skill 是业务能力包，比如订单查询、物流追踪、售后处理。
  // getEnabledSkills 会合并源码里的 SkillDefinition 和数据库里的 SkillConfig，
  // 再根据当前 role 过滤出可用 Skill。
  const enabledSkills = await getEnabledSkills(role);

  // Tool 是模型真正能调用的执行单元。
  // getVisibleTools 会把当前角色可用 Skill 下的 tools 展平。
  const visibleTools = await getVisibleTools(role);

  // streamText 是 Vercel AI SDK 的核心调用：
  // 1. 把 messages + system prompt 发给模型；
  // 2. 把 tools 暴露给模型；
  // 3. 模型选择 tool 时执行本地 execute；
  // 4. 将文本、tool call、tool result 流式返回给前端。
  const stream = streamText({
    // 这里实际请求 DashScope 的 qwen-plus。
    model: qwen("qwen-plus"),

    // system prompt 会告诉模型当前角色、可用 Skill、何时用工具、
    // 缺参数时如何追问、写入类工具不能直接声称已完成等规则。
    system: buildSystemPrompt({ role, skills: enabledSkills }),

    // 用户和助手的历史消息，直接交给模型理解上下文。
    messages,

    // 允许模型多步调用工具。
    // 例如先 listOrders 找订单，再 viewTrackingInformation 查物流，
    // 最后基于工具结果总结给用户。
    maxSteps: 5,

    // 把项目内部的 ToolDefinition 转换成 AI SDK 需要的 tools 对象。
    // adapter 内部会把每次 tool.execute 包上一层 executeWithTrace，
    // 因此工具执行会真实写入 ToolCallTrace。
    tools: toAiSdkTools(visibleTools, { role, conversationId }),
  });

  // AI SDK 的 Data Stream Response 是 useChat 能直接消费的格式。
  // 前端会收到 assistant 文本、tool 调用状态和 tool 结果。
  return stream.toDataStreamResponse({
    // 统一把流式过程里的异常转换成前端可展示的字符串。
    getErrorMessage: (error) => {
      console.error("AI stream error:", error);

      if (error instanceof Error) {
        return error.message;
      }

      return String(error);
    },
  });
}
