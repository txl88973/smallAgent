import prisma from "@/lib/prisma";
import { z } from "zod";

import type { SkillDefinition, ToolDefinition } from "../types";

const getRefundPolicyParameters = z.object({
  orderNo: z.string().describe("The order number, for example ORD-1001."),
});

const getRefundPolicyTool: ToolDefinition<typeof getRefundPolicyParameters> = {
  name: "getRefundPolicy",
  description: "根据订单签收状态和签收时间判断是否满足售后退款条件。",
  parameters: getRefundPolicyParameters,
  riskLevel: "read",
  renderType: "refund-policy-card",
  execute: async ({ orderNo }) => {
    const order = await prisma.order.findUnique({
      where: { orderNo },
      select: {
        orderNo: true,
        status: true,
        signedAt: true,
      },
    });

    if (!order) {
      throw new Error(`订单 ${orderNo} 不存在，无法判断售后政策。`);
    }

    if (order.status !== "已签收" || !order.signedAt) {
      return {
        orderNo: order.orderNo,
        refundable: false,
        reason: "订单尚未签收，不满足当前售后退款规则。",
      };
    }

    const deadline = new Date(order.signedAt);
    deadline.setDate(deadline.getDate() + 7);

    const refundable = Date.now() <= deadline.getTime();

    return {
      orderNo: order.orderNo,
      refundable,
      reason: refundable
        ? "订单已签收且仍在 7 天售后窗口内。"
        : "订单已超过 7 天售后窗口。",
      deadline: deadline.toISOString(),
    };
  },
};

const createAfterSalesTicketDraftParameters = z.object({
  orderNo: z.string().describe("The order number, for example ORD-1001."),
  reason: z.string().min(1).describe("The after-sales request reason."),
  priority: z.enum(["low", "normal", "high"]).describe("Ticket priority."),
});

const createAfterSalesTicketDraftTool: ToolDefinition<
  typeof createAfterSalesTicketDraftParameters
> = {
  name: "createAfterSalesTicketDraft",
  description:
    "生成售后工单草稿。该工具不会真实写入数据库，必须等待后续确认。",
  parameters: createAfterSalesTicketDraftParameters,
  riskLevel: "write",
  renderType: "ticket-confirm-card",
  execute: async ({ orderNo, reason, priority }) => {
    const order = await prisma.order.findUnique({
      where: { orderNo },
      select: { orderNo: true },
    });

    if (!order) {
      throw new Error(`订单 ${orderNo} 不存在，无法生成售后工单草稿。`);
    }

    return {
      orderNo: order.orderNo,
      reason,
      priority,
      confirmRequired: true,
      message:
        "已生成售后工单草稿，尚未真实创建工单。请确认后再进入正式创建流程。",
    };
  },
};

export const afterSalesSkill: SkillDefinition = {
  id: "after-sales",
  name: "售后处理",
  description: "判断退款规则并生成售后工单草稿。",
  roles: ["admin"],
  tools: [getRefundPolicyTool, createAfterSalesTicketDraftTool],
  promptPolicy: {
    whenToUse: "管理员询问退款政策、售后资格或需要创建售后工单草稿时使用。",
    constraints: [
      "只有 admin 角色可以使用售后处理 Skill。",
      "生成工单草稿不代表真实创建工单。",
      "缺少订单号、售后原因或优先级时需要先追问。",
    ],
    missingParamsStrategy: "ask-user",
  },
  confirmationPolicy: {
    requiredForTools: ["createAfterSalesTicketDraft"],
    reason: "售后工单属于写入类动作，本阶段只允许生成草稿，不能真实写库。",
  },
};
