import prisma from "@/lib/prisma";
import { z } from "zod";

import type { SkillDefinition, ToolDefinition } from "../types";

const viewTrackingInformationParameters = z.object({
  orderNo: z.string().describe("The order number, for example ORD-1001."),
});

const viewTrackingInformationTool: ToolDefinition<
  typeof viewTrackingInformationParameters
> = {
  name: "viewTrackingInformation",
  description: "根据订单号查询物流轨迹和当前物流状态。",
  parameters: viewTrackingInformationParameters,
  riskLevel: "read",
  renderType: "tracking-timeline",
  execute: async ({ orderNo }) => {
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { tracking: true },
    });

    if (!order) {
      throw new Error(`订单 ${orderNo} 不存在，无法查询物流。`);
    }

    if (!order.tracking) {
      throw new Error(`订单 ${orderNo} 暂无物流信息。`);
    }

    return {
      orderNo: order.orderNo,
      carrier: order.tracking.carrier,
      trackingNo: order.tracking.trackingNo,
      currentStatus: order.tracking.currentStatus,
      steps: Array.isArray(order.tracking.steps) ? order.tracking.steps : [],
    };
  },
};

export const logisticsSkill: SkillDefinition = {
  id: "logistics-tracking",
  name: "物流追踪",
  description: "查询订单对应物流承运商、运单号、当前状态和物流节点。",
  roles: ["user", "admin"],
  tools: [viewTrackingInformationTool],
  promptPolicy: {
    whenToUse: "用户询问包裹、配送、快递、运单或物流状态时使用。",
    constraints: [
      "查询物流必须有明确订单号；缺少订单号时先追问。",
      "只能基于 Tracking 表中的真实物流数据回答。",
      "如果订单不存在或暂无物流信息，需要明确告知用户。",
    ],
    missingParamsStrategy: "ask-user",
  },
};
