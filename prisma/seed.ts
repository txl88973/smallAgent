import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import prisma from "../lib/prisma";

const orders = [
  {
    orderNo: "ORD-1001",
    customerName: "张三",
    status: "已签收",
    amount: "299.00",
    paidAt: new Date("2026-05-19T10:12:00+08:00"),
    signedAt: new Date("2026-05-21T16:35:00+08:00"),
    tracking: {
      carrier: "顺丰速运",
      trackingNo: "SF1001001",
      currentStatus: "已签收",
      steps: [
        {
          status: "已揽收",
          location: "上海仓",
          time: "2026-05-19T13:20:00+08:00",
        },
        {
          status: "运输中",
          location: "杭州转运中心",
          time: "2026-05-20T08:45:00+08:00",
        },
        {
          status: "已签收",
          location: "杭州西湖区",
          time: "2026-05-21T16:35:00+08:00",
        },
      ] satisfies Prisma.InputJsonValue,
    },
  },
  {
    orderNo: "ORD-1002",
    customerName: "李四",
    status: "运输中",
    amount: "159.00",
    paidAt: new Date("2026-05-22T09:05:00+08:00"),
    signedAt: null,
    tracking: {
      carrier: "中通快递",
      trackingNo: "ZTO1002002",
      currentStatus: "运输中",
      steps: [
        {
          status: "已揽收",
          location: "广州仓",
          time: "2026-05-22T11:10:00+08:00",
        },
        {
          status: "离开发件城市",
          location: "广州转运中心",
          time: "2026-05-22T20:30:00+08:00",
        },
        {
          status: "运输中",
          location: "长沙转运中心",
          time: "2026-05-23T08:20:00+08:00",
        },
      ] satisfies Prisma.InputJsonValue,
    },
  },
  {
    orderNo: "ORD-1003",
    customerName: "王五",
    status: "待发货",
    amount: "499.00",
    paidAt: new Date("2026-05-23T12:18:00+08:00"),
    signedAt: null,
    tracking: {
      carrier: "京东物流",
      trackingNo: "JD1003003",
      currentStatus: "待发货",
      steps: [
        {
          status: "订单已创建",
          location: "北京仓",
          time: "2026-05-23T12:18:00+08:00",
        },
        {
          status: "仓库已接单",
          location: "北京仓",
          time: "2026-05-23T12:40:00+08:00",
        },
        {
          status: "等待出库",
          location: "北京仓",
          time: "2026-05-23T13:05:00+08:00",
        },
      ] satisfies Prisma.InputJsonValue,
    },
  },
];

const skillConfigs = [
  {
    skillId: "order-query",
    name: "订单查询",
    allowedRoles: ["user", "admin"],
    enabled: true,
    sortOrder: 1,
  },
  {
    skillId: "logistics-tracking",
    name: "物流追踪",
    allowedRoles: ["user", "admin"],
    enabled: true,
    sortOrder: 2,
  },
  {
    skillId: "after-sales",
    name: "售后处理",
    allowedRoles: ["admin"],
    enabled: true,
    sortOrder: 3,
  },
];

const users = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
  },
  {
    username: "user",
    password: "user123",
    role: "user",
  },
];

async function main() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash,
        role: user.role,
      },
      create: {
        username: user.username,
        passwordHash,
        role: user.role,
      },
    });
  }

  for (const orderSeed of orders) {
    const order = await prisma.order.upsert({
      where: { orderNo: orderSeed.orderNo },
      update: {
        customerName: orderSeed.customerName,
        status: orderSeed.status,
        amount: new Prisma.Decimal(orderSeed.amount),
        paidAt: orderSeed.paidAt,
        signedAt: orderSeed.signedAt,
      },
      create: {
        orderNo: orderSeed.orderNo,
        customerName: orderSeed.customerName,
        status: orderSeed.status,
        amount: new Prisma.Decimal(orderSeed.amount),
        paidAt: orderSeed.paidAt,
        signedAt: orderSeed.signedAt,
      },
    });

    await prisma.tracking.upsert({
      where: { orderId: order.id },
      update: {
        carrier: orderSeed.tracking.carrier,
        trackingNo: orderSeed.tracking.trackingNo,
        currentStatus: orderSeed.tracking.currentStatus,
        steps: orderSeed.tracking.steps,
      },
      create: {
        orderId: order.id,
        carrier: orderSeed.tracking.carrier,
        trackingNo: orderSeed.tracking.trackingNo,
        currentStatus: orderSeed.tracking.currentStatus,
        steps: orderSeed.tracking.steps,
      },
    });
  }

  for (const skillConfig of skillConfigs) {
    await prisma.skillConfig.upsert({
      where: { skillId: skillConfig.skillId },
      update: {
        name: skillConfig.name,
        enabled: skillConfig.enabled,
        allowedRoles: skillConfig.allowedRoles,
        sortOrder: skillConfig.sortOrder,
      },
      create: skillConfig,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
