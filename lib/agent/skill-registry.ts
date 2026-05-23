import prisma from "@/lib/prisma";

import { afterSalesSkill } from "./skills/after-sales.skill";
import { logisticsSkill } from "./skills/logistics.skill";
import { orderSkill } from "./skills/order.skill";
import type { Role, SkillDefinition, ToolDefinition } from "./types";

export const skillRegistry: SkillDefinition[] = [
  orderSkill,
  logisticsSkill,
  afterSalesSkill,
];

type SkillConfigValue = {
  enabled: boolean;
  allowedRoles: Role[];
  sortOrder: number;
};

const isRole = (value: unknown): value is Role =>
  value === "admin" || value === "user";

const parseAllowedRoles = (
  value: unknown,
  fallbackRoles: Role[],
): Role[] => {
  if (!Array.isArray(value)) {
    return fallbackRoles;
  }

  const roles = value.filter(isRole);
  return roles.length > 0 ? roles : fallbackRoles;
};

export async function getSkillConfigMap() {
  const configs = await prisma.skillConfig.findMany();
  const configMap = new Map<string, SkillConfigValue>();

  for (const config of configs) {
    const registrySkill = skillRegistry.find(
      (skill) => skill.id === config.skillId,
    );

    configMap.set(config.skillId, {
      enabled: config.enabled,
      allowedRoles: parseAllowedRoles(
        config.allowedRoles,
        registrySkill?.roles ?? [],
      ),
      sortOrder: config.sortOrder,
    });
  }

  return configMap;
}

export async function getEnabledSkills(role: Role) {
  const configMap = await getSkillConfigMap();

  return skillRegistry
    .map((skill, index) => {
      const config = configMap.get(skill.id);
      return {
        skill,
        enabled: config?.enabled ?? true,
        allowedRoles: config?.allowedRoles ?? skill.roles,
        sortOrder: config?.sortOrder ?? index,
      };
    })
    .filter(({ enabled, allowedRoles }) => {
      return enabled && allowedRoles.includes(role);
    })
    .sort((left, right) => {
      return left.sortOrder - right.sortOrder;
    })
    .map(({ skill }) => skill);
}

export async function getVisibleTools(role: Role) {
  const skills = await getEnabledSkills(role);

  return skills.flatMap((skill) =>
    skill.tools.map((tool) => ({
      skill,
      tool,
    })),
  );
}

export async function getSkillPanelData(role: Role) {
  const configMap = await getSkillConfigMap();

  return skillRegistry
    .map((skill, index) => {
      const config = configMap.get(skill.id);
      const enabled = config?.enabled ?? true;
      const allowedRoles = config?.allowedRoles ?? skill.roles;

      return {
        skillId: skill.id,
        name: skill.name,
        description: skill.description,
        enabled,
        hasPermission: enabled && allowedRoles.includes(role),
        allowedRoles,
        sortOrder: config?.sortOrder ?? index,
        tools: skill.tools.map((tool: ToolDefinition) => ({
          name: tool.name,
          description: tool.description,
          riskLevel: tool.riskLevel,
          renderType: tool.renderType,
        })),
        promptPolicy: skill.promptPolicy,
        confirmationPolicy: skill.confirmationPolicy,
      };
    })
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(({ sortOrder, ...skill }) => skill);
}
