import prisma from "@/lib/prisma";
import { z } from "zod";

import type { SkillDefinition, ToolDefinition } from "../types";

const listOrdersParameters = z.object({
  status: z.string().optional().describe("Optional order status filter."),
});

const listOrdersTool: ToolDefinition<typeof listOrdersParameters> = {
  name: "listOrders",
  description:
    "查询订单列表。用户询问订单、购买记录、发货状态或所有订单时使用。",
  parameters: listOrdersParameters,
  riskLevel: "read",
  renderType: "order-list",
  execute: async ({ status }) => {
    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { orderNo: "asc" },
      select: {
        orderNo: true,
        customerName: true,
        status: true,
        amount: true,
        createdAt: true,
      },
    });

    return orders.map((order) => ({
      orderNo: order.orderNo,
      customerName: order.customerName,
      status: order.status,
      amount: order.amount.toFixed(2),
      createdAt: order.createdAt.toISOString(),
    }));
  },
};

const getOrderDetailParameters = z.object({
  orderNo: z.string().describe("The order number, for example ORD-1001."),
});

const getOrderDetailTool: ToolDefinition<typeof getOrderDetailParameters> = {
  name: "getOrderDetail",
  description: "根据订单号查询订单详情。用户询问单个订单详情时使用。",
  parameters: getOrderDetailParameters,
  riskLevel: "read",
  renderType: "order-card",
  execute: async ({ orderNo }) => {
    const order = await prisma.order.findUnique({
      where: { orderNo },
      select: {
        orderNo: true,
        customerName: true,
        status: true,
        amount: true,
        paidAt: true,
        signedAt: true,
        createdAt: true,
      },
    });

    if (!order) {
      throw new Error(`订单 ${orderNo} 不存在，请确认订单号是否正确。`);
    }

    return {
      orderNo: order.orderNo,
      customerName: order.customerName,
      status: order.status,
      amount: order.amount.toFixed(2),
      paidAt: order.paidAt?.toISOString() ?? null,
      signedAt: order.signedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
    };
  },
};

export const orderSkill: SkillDefinition = {
  id: "order-query",
  name: "订单查询",
  description: "查询订单列表、订单状态和单个订单基础信息。",
  roles: ["user", "admin"],
  tools: [listOrdersTool, getOrderDetailTool],
  promptPolicy: {
    whenToUse: "用户询问订单列表、订单状态、购买记录或单个订单详情时使用。",
    constraints: [
      "只能返回数据库中真实存在的订单。",
      "查询单个订单详情时必须有明确订单号；缺少订单号时先追问。",
      "不要编造订单号、客户姓名、支付时间或签收时间。",
    ],
    missingParamsStrategy: "ask-user",
  },
};
