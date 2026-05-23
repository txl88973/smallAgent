"use client";

import type { Role } from "./role-selector";

export type ToolCallRecord = {
  toolName: string;
  skillName: string;
  role: Role;
  status: "success" | "mock" | "denied";
  createdAt: string;
  summary: string;
};

const toolCallRecords: ToolCallRecord[] = [
  {
    toolName: "listOrders",
    skillName: "订单查询",
    role: "user",
    status: "success",
    createdAt: "2026-05-09 09:30",
    summary: "query: where is my watch?",
  },
  {
    toolName: "viewTrackingInformation",
    skillName: "物流追踪",
    role: "user",
    status: "success",
    createdAt: "2026-05-09 09:31",
    summary: "orderId: 412093",
  },
  {
    toolName: "queryDeviceStatus",
    skillName: "设备状态查询",
    role: "admin",
    status: "mock",
    createdAt: "2026-05-09 09:35",
    summary: "device group: demo fleet",
  },
  {
    toolName: "createWorkOrder",
    skillName: "工单创建",
    role: "user",
    status: "denied",
    createdAt: "2026-05-09 09:38",
    summary: "permission check blocked user role",
  },
];

const getStatusClassName = (status: ToolCallRecord["status"]) => {
  switch (status) {
    case "success":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900";
    case "mock":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900";
    case "denied":
      return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700";
  }
};

export const ToolCallRecords = () => {
  return (
    <section className="flex flex-col gap-3 border border-zinc-200 rounded-lg p-4 dark:border-zinc-800">
      <div>
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Tool Call Records
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          mock 调用记录
        </p>
      </div>

      <ul
        aria-label="Mock tool call records"
        className="flex flex-col gap-2"
      >
        {toolCallRecords.map((record) => (
          <li
            key={`${record.toolName}-${record.createdAt}`}
            className="min-w-0 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-all text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {record.toolName}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {record.createdAt}
                </p>
              </div>

              <span
                className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${getStatusClassName(
                  record.status,
                )}`}
              >
                {record.status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{record.skillName}</span>
              <span aria-hidden="true">/</span>
              <span>role: {record.role}</span>
            </div>

            <p className="mt-2 break-words text-xs leading-5 text-zinc-700 dark:text-zinc-300">
              {record.summary}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};
