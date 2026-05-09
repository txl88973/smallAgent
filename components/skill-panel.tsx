"use client";

import type { Role } from "./role-selector";

type SkillGroup = "query" | "operations";

type SkillItem = {
  toolName: string;
  skillName: string;
  group: SkillGroup;
  description: string;
  adminOnly?: boolean;
  badge?: string;
};

const skills: SkillItem[] = [
  {
    toolName: "listOrders",
    skillName: "订单查询",
    group: "query",
    description: "查询订单列表、发货状态和历史购买信息。",
  },
  {
    toolName: "viewTrackingInformation",
    skillName: "物流追踪",
    group: "query",
    description: "根据订单号查看包裹运输和配送进度。",
  },
  {
    toolName: "queryDeviceStatus",
    skillName: "设备状态查询",
    group: "operations",
    description: "模拟查询设备在线状态、健康度和最近心跳。",
    adminOnly: true,
    badge: "mock",
  },
  {
    toolName: "createWorkOrder",
    skillName: "工单创建",
    group: "operations",
    description: "模拟创建运维工单；当前仅用于无权限 demo。",
    adminOnly: true,
    badge: "no permission demo",
  },
];

const groups: Array<{
  key: SkillGroup;
  title: string;
}> = [
  { key: "query", title: "查询类 Skill" },
  { key: "operations", title: "运维类 Skill" },
];

export const SkillPanel = ({ role }: { role: Role }) => {
  return (
    <section className="flex flex-col gap-4 border border-zinc-200 rounded-lg p-4 dark:border-zinc-800">
      <div>
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Skill / Tool
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          当前角色：{role}
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {group.title}
          </h3>

          <div className="flex flex-col gap-2">
            {skills
              .filter((skill) => skill.group === group.key)
              .map((skill) => {
                const hasPermission = role === "admin" || !skill.adminOnly;

                return (
                  <div
                    key={skill.toolName}
                    className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {skill.skillName}
                        </div>
                        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {skill.toolName}
                        </div>
                      </div>

                      {hasPermission ? (
                        skill.badge && (
                          <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {skill.badge}
                          </span>
                        )
                      ) : (
                        <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          无权限
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                      {hasPermission ? skill.description : "无权限"}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </section>
  );
};
