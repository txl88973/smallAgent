import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

import type { ToolDefinition, ToolExecutionContext } from "./types";

const normalizeJson = (value: unknown): Prisma.InputJsonValue | null => {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.parse(
      JSON.stringify(value, (_key, currentValue) => {
        if (typeof currentValue === "bigint") {
          return currentValue.toString();
        }

        return currentValue;
      }),
    ) as Prisma.InputJsonValue | null;
  } catch {
    return String(value);
  }
};

const toNullableJson = (value: unknown) => {
  return normalizeJson(value) ?? Prisma.JsonNull;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export async function executeWithTrace(
  toolDef: ToolDefinition,
  args: unknown,
  context: ToolExecutionContext,
) {
  const startedAt = Date.now();

  try {
    const result = await toolDef.execute(args, context);

    await prisma.toolCallTrace.create({
      data: {
        conversationId: context.conversationId ?? null,
        skillId: context.skillId,
        skillName: context.skillName,
        toolName: toolDef.name,
        role: context.role,
        args: toNullableJson(args),
        result: toNullableJson(result),
        status: "success",
        latencyMs: Date.now() - startedAt,
      },
    });

    return {
      renderType: toolDef.renderType,
      data: result,
    };
  } catch (error) {
    await prisma.toolCallTrace.create({
      data: {
        conversationId: context.conversationId ?? null,
        skillId: context.skillId,
        skillName: context.skillName,
        toolName: toolDef.name,
        role: context.role,
        args: toNullableJson(args),
        result: Prisma.JsonNull,
        status: "error",
        latencyMs: Date.now() - startedAt,
        errorMessage: getErrorMessage(error),
      },
    });

    throw error;
  }
}
