import { getOrders, getTrackingInformation } from "@/components/data";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

// createOpenAI 是 Vercel AI SDK 提供的 OpenAI-compatible provider 工厂。
// DashScope / Qwen 提供了兼容 OpenAI Chat Completions 风格的接口，
// 所以这里可以复用 @ai-sdk/openai，而不是单独安装 Qwen 专用 SDK。
const qwen = createOpenAI({
  // 服务端环境变量。这个文件运行在 Next.js Route Handler 的服务端环境中，
  // 不会被打包到浏览器，所以可以安全读取 API Key。
  apiKey: process.env.DASHSCOPE_API_KEY,
  // DashScope 的 OpenAI-compatible endpoint。
  // 后面调用 qwen("qwen-plus") 时，请求会发到这个 baseURL。
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

// Next.js App Router 的 Route Handler。
// 文件路径 app/(preview)/api/chat/route.ts 会被映射成接口 /api/chat。
// useChat() 默认会向 /api/chat 发送 POST 请求，所以前端不需要额外配置 API 地址。
export async function POST(request: Request) {
  // useChat 会把前端当前的对话历史放进请求体：
  // {
  //   messages: [
  //     { role: "user", content: "where is my watch?" },
  //     ...
  //   ]
  // }
  //
  // 模型需要完整 messages 才能理解上下文，并决定是否调用工具。
  const { messages } = await request.json();

  // streamText 是 Vercel AI SDK 的核心文本生成函数。
  // 它负责：
  // 1. 把 messages 发给模型；
  // 2. 暴露 tools 给模型选择；
  // 3. 在模型决定调用 tool 时执行本地 execute；
  // 4. 把模型文本、tool call、tool result 以流式协议返回给前端。
  const stream = streamText({
    // 这里选择 DashScope 上的 qwen-plus 模型。
    // qwen 来自上面的 createOpenAI 配置，因此它会走 DashScope 的兼容接口。
    model: qwen("qwen-plus"),

    // system prompt 是给模型的全局规则。
    // 这里明确告诉模型：遇到订单、包裹、物流相关问题时优先使用 tools。
    // 这会影响模型是否主动选择 listOrders / viewTrackingInformation。
    system: `\
      - you are a friendly package tracking assistant
      - your responses are concise
      - when users ask about orders, shipments, packages, tracking, or delivery status, you should use the available tools
      - after using tools, always provide a short plain text answer
    `,

    // 用户和助手的历史消息。useChat 管理这些消息，后端直接透传给模型。
    messages,

    // 允许模型进行多步调用。
    // 例如：
    // 第一步：模型发现用户问 "my watch"，先调用 listOrders 找订单；
    // 第二步：根据订单号再调用 viewTrackingInformation 查物流；
    // 第三步：模型基于工具结果生成最终自然语言回答。
    maxSteps: 5,

    // tools 是暴露给模型的“可调用能力”。
    // 每个 tool 由三部分组成：
    // - description：告诉模型什么时候应该调用这个工具；
    // - parameters：用 Zod 定义参数结构，AI SDK 会据此生成 JSON Schema 给模型；
    // - execute：模型真的选择该工具后，服务端实际执行的函数。
    tools: {
      listOrders: {
        // description 越清晰，模型越容易在正确场景选择这个工具。
        description:
          "List all orders. Use this when the user asks about orders, shipped packages, purchases, or deliveries.",

        // Zod schema 用来描述 tool 入参。
        // AI SDK 会把它转换成模型可理解的 tool 参数 schema。
        // 这里 query 是 optional，因为列订单时不一定需要用户提供额外参数。
        parameters: z.object({
          query: z
            .string()
            .optional()
            .describe("Optional user query. Leave empty when listing all orders."),
        }),

        // execute 是真正的业务逻辑。
        // 注意：query 当前只是为了演示参数 schema，函数内部没有实际使用它。
        // getOrders() 返回 components/data.ts 里的 mock 订单数据。
        execute: async function ({ query }) {
          const orders = getOrders();
          return orders;
        },
      },

      viewTrackingInformation: {
        // 这个工具用于根据订单号查询物流信息。
        // 通常模型会先通过 listOrders 找到 orderId，再调用这个工具。
        description: "View tracking information for a specific order.",

        // orderId 是必填参数。
        // 如果模型调用工具但没有提供 orderId，Zod 校验会阻止无效入参进入 execute。
        parameters: z.object({
          orderId: z
            .string()
            .describe("The id of the order that the user wants to track."),
        }),

        // execute 收到经过 schema 校验后的 orderId。
        // getTrackingInformation() 会从 mock 数据中找对应订单的物流状态。
        execute: async function ({ orderId }) {
          const trackingInformation = getTrackingInformation({ orderId });

          // 模拟一次异步查询耗时，让前端更容易观察 tool calling 的过程。
          // 真实业务中这里可能是数据库查询、HTTP API 调用或内部系统调用。
          await new Promise((resolve) => setTimeout(resolve, 500));

          // 返回值会作为 tool result 回到 AI SDK，
          // 然后继续交给模型用于生成最终回答，同时前端 Message 组件也能渲染它。
          return trackingInformation;
        },
      },
    },
  });

  // 把 AI SDK 的流转换成 useChat 能识别的 Data Stream Response。
  // 前端 useChat 会消费这个流，并实时更新：
  // - assistant 文本；
  // - tool invocation 状态；
  // - tool result。
  return stream.toDataStreamResponse({
    // 统一处理流式生成过程中的错误。
    // 返回字符串后，前端可以把错误内容展示出来，避免只看到请求失败。
    getErrorMessage: (error) => {
      console.error("AI stream error:", error);

      if (error instanceof Error) {
        return error.message;
      }

      return String(error);
    },
  });
}
