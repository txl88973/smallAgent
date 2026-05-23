import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";
import type { Role } from "@/lib/agent/types";

export const runtime = "nodejs";

const confirmSchema = z.object({
  orderNo: z.string().min(1),
  reason: z.string().min(1),
  priority: z.enum(["low", "normal", "high"]),
  role: z.enum(["admin", "user"]).optional().default("admin"),
  conversationId: z.string().optional(),
});

type ConfirmArgs = z.infer<typeof confirmSchema>;

const normalizeJson = (value: unknown) => {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return String(value);
  }
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const createTicketNo = () => {
  const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `AS-${today}-${random}`;
};

async function writeConfirmTrace({
  args,
  role,
  conversationId,
  result,
  status,
  latencyMs,
  errorMessage,
}: {
  args: unknown;
  role: Role;
  conversationId?: string;
  result: unknown;
  status: "success" | "error";
  latencyMs: number;
  errorMessage?: string;
}) {
  await prisma.toolCallTrace.create({
    data: {
      conversationId: conversationId ?? null,
      skillId: "after-sales",
      skillName: "售后处理",
      toolName: "confirmAfterSalesTicket",
      role,
      args: normalizeJson(args),
      result: status === "success" ? normalizeJson(result) : Prisma.JsonNull,
      status,
      latencyMs,
      errorMessage,
    },
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const body = await request.json().catch(() => ({}));
  const fallbackRole: Role = body?.role === "user" ? "user" : "admin";
  const fallbackConversationId =
    typeof body?.conversationId === "string" ? body.conversationId : undefined;

  try {
    const args = confirmSchema.parse(body);

    if (args.role !== "admin") {
      const errorMessage = "只有 admin 可以确认创建售后工单。";

      await writeConfirmTrace({
        args,
        role: args.role,
        conversationId: args.conversationId,
        result: null,
        status: "error",
        latencyMs: Date.now() - startedAt,
        errorMessage,
      });

      return Response.json({ error: errorMessage }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNo: args.orderNo },
      select: { id: true, orderNo: true },
    });

    if (!order) {
      const errorMessage = `订单 ${args.orderNo} 不存在。`;

      await writeConfirmTrace({
        args,
        role: args.role,
        conversationId: args.conversationId,
        result: null,
        status: "error",
        latencyMs: Date.now() - startedAt,
        errorMessage,
      });

      return Response.json({ error: errorMessage }, { status: 404 });
    }

    const ticket = await prisma.afterSalesTicket.create({
      data: {
        ticketNo: createTicketNo(),
        orderId: order.id,
        reason: args.reason,
        priority: args.priority,
        status: "created",
        createdByRole: args.role,
      },
      select: {
        ticketNo: true,
        reason: true,
        priority: true,
        status: true,
        createdAt: true,
        order: {
          select: { orderNo: true },
        },
      },
    });

    const result = {
      ticketNo: ticket.ticketNo,
      orderNo: ticket.order.orderNo,
      reason: ticket.reason,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
    };

    await writeConfirmTrace({
      args: {
        orderNo: args.orderNo,
        reason: args.reason,
        priority: args.priority,
      },
      role: args.role,
      conversationId: args.conversationId,
      result,
      status: "success",
      latencyMs: Date.now() - startedAt,
    });

    return Response.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError ? "请求参数不完整或不合法。" : getErrorMessage(error);

    await writeConfirmTrace({
      args: body,
      role: fallbackRole,
      conversationId: fallbackConversationId,
      result: null,
      status: "error",
      latencyMs: Date.now() - startedAt,
      errorMessage,
    }).catch((traceError) => {
      console.error("Failed to write after-sales confirm trace:", traceError);
    });

    return Response.json({ error: errorMessage }, { status: 400 });
  }
}
