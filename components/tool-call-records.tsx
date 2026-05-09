"use client";

import type { Role } from "./role-selector";

export type ToolCallRecord = {
  toolName: string;
  skillName: string;
  role: Role;
  status: "success" | "mock" | "denied";
  createdAt: string;
};

const toolCallRecords: ToolCallRecord[] = [
  {
    toolName: "listOrders",
    skillName: "订单查询",
    role: "user",
    status: "success",
    createdAt: "2026-05-09 09:30",
  },
  {
    toolName: "viewTrackingInformation",
    skillName: "物流追踪",
    role: "user",
    status: "success",
    createdAt: "2026-05-09 09:31",
  },
  {
    toolName: "queryDeviceStatus",
    skillName: "设备状态查询",
    role: "admin",
    status: "mock",
    createdAt: "2026-05-09 09:35",
  },
  {
    toolName: "createWorkOrder",
    skillName: "工单创建",
    role: "user",
    status: "denied",
    createdAt: "2026-05-09 09:38",
  },
];

const getStatusClassName = (status: ToolCallRecord["status"]) => {
  switch (status) {
    case "success":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    case "mock":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    case "denied":
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-zinc-500 dark:text-zinc-400">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2 pr-3 font-medium">Tool</th>
              <th className="py-2 pr-3 font-medium">Skill</th>
              <th className="py-2 pr-3 font-medium">Role</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {toolCallRecords.map((record) => (
              <tr
                key={`${record.toolName}-${record.createdAt}`}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="max-w-[120px] truncate py-2 pr-3 text-zinc-700 dark:text-zinc-300">
                  {record.toolName}
                </td>
                <td className="py-2 pr-3 text-zinc-700 dark:text-zinc-300">
                  {record.skillName}
                </td>
                <td className="py-2 pr-3 text-zinc-500 dark:text-zinc-400">
                  {record.role}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded px-2 py-0.5 ${getStatusClassName(
                      record.status,
                    )}`}
                  >
                    {record.status}
                  </span>
                </td>
                <td className="whitespace-nowrap py-2 text-zinc-500 dark:text-zinc-400">
                  {record.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
