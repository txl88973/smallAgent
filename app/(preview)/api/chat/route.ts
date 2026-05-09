import { getOrders, getTrackingInformation } from "@/components/data";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

const qwen = createOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = streamText({
    model: qwen("qwen-plus"),
    system: `\
      - you are a friendly package tracking assistant
      - your responses are concise
      - when users ask about orders, shipments, packages, tracking, or delivery status, you should use the available tools
      - after using tools, always provide a short plain text answer
    `,
    messages,
    maxSteps: 5,
    tools: {
      listOrders: {
        description:
          "List all orders. Use this when the user asks about orders, shipped packages, purchases, or deliveries.",
        parameters: z.object({
          query: z
            .string()
            .optional()
            .describe("Optional user query. Leave empty when listing all orders."),
        }),
        execute: async function ({ query }) {
          const orders = getOrders();
          return orders;
        },
      },

      viewTrackingInformation: {
        description: "View tracking information for a specific order.",
        parameters: z.object({
          orderId: z
            .string()
            .describe("The id of the order that the user wants to track."),
        }),
        execute: async function ({ orderId }) {
          const trackingInformation = getTrackingInformation({ orderId });
          await new Promise((resolve) => setTimeout(resolve, 500));
          return trackingInformation;
        },
      },
    },
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