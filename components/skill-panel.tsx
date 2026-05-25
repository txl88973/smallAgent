"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { Role } from "./role-selector";

type SkillPanelTool = {
  name: string;
  description: string;
  riskLevel: "read" | "write";
  renderType: string;
};

type SkillPanelItem = {
  skillId: string;
  name: string;
  description: string;
  enabled: boolean;
  hasPermission: boolean;
  allowedRoles: Role[];
  tools: SkillPanelTool[];
  promptPolicy: {
    whenToUse: string;
    constraints: string[];
    missingParamsStrategy: "ask-user" | "infer-from-context";
  };
  confirmationPolicy?: {
    requiredForTools: string[];
    reason: string;
  };
};

const getStatusBadgeClassName = (skill: SkillPanelItem) => {
  if (!skill.enabled) {
    return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
  }

  if (!skill.hasPermission) {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900";
  }

  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900";
};

const getStatusText = (skill: SkillPanelItem) => {
  if (!skill.enabled) {
    return "disabled";
  }

  return skill.hasPermission ? "enabled" : "无权限";
};

export const SkillPanel = ({ role }: { role: Role }) => {
  const [skills, setSkills] = useState<SkillPanelItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadSkills() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiClient.get<SkillPanelItem[]>("/api/skills");
        const data = response.data;

        if (isActive) {
          setSkills(data);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadSkills();

    return () => {
      isActive = false;
    };
  }, [role]);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div>
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Skill Registry
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          当前角色可用能力：{role}
        </p>
      </div>

      {errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          正在加载 Skill 数据...
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {skills.map((skill) => (
            <div
              key={skill.skillId}
              className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {skill.name}
                  </div>
                  <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {skill.skillId}
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${getStatusBadgeClassName(
                    skill,
                  )}`}
                >
                  {getStatusText(skill)}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                {skill.description}
              </p>

              <div className="mt-2 flex flex-wrap gap-1">
                {skill.tools.map((tool) => (
                  <span
                    key={tool.name}
                    title={`${tool.description} · ${tool.renderType}`}
                    className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {tool.name} · {tool.riskLevel}
                  </span>
                ))}
              </div>

              <div className="mt-3 space-y-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    when:
                  </span>{" "}
                  {skill.promptPolicy.whenToUse}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    missing:
                  </span>{" "}
                  {skill.promptPolicy.missingParamsStrategy}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    roles:
                  </span>{" "}
                  {skill.allowedRoles.join(", ")}
                </p>
              </div>

              {skill.confirmationPolicy && (
                <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs leading-5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  {skill.confirmationPolicy.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
