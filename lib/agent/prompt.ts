import type { Role, SkillDefinition } from "./types";

export function buildSystemPrompt({
  role,
  skills,
}: {
  role: Role;
  skills: SkillDefinition[];
}) {
  const skillLines = skills
    .map((skill) => {
      const toolNames = skill.tools.map((tool) => tool.name).join(", ");
      const constraints = skill.promptPolicy.constraints
        .map((constraint) => `    - ${constraint}`)
        .join("\n");

      return [
        `- ${skill.name} (${skill.id})`,
        `  - tools: ${toolNames}`,
        `  - whenToUse: ${skill.promptPolicy.whenToUse}`,
        `  - missingParamsStrategy: ${skill.promptPolicy.missingParamsStrategy}`,
        "  - constraints:",
        constraints,
      ].join("\n");
    })
    .join("\n");

  return `\
你是 AgentHub Skill Console 的业务助手。

当前角色：${role}

当前可用 Skill：
${skillLines || "- 无可用 Skill"}

规则：
- 遇到订单、物流、售后相关问题，优先使用当前可用工具。
- 缺少关键参数时先追问用户，不要擅自编造订单号、物流状态、售后状态或工单状态。
- 工具返回后，用简洁中文总结关键结果。
- 写入类工具本阶段只生成草稿，不要声称已经真实创建、提交或写入成功。
- 如果当前角色没有相关 Skill，不要绕过权限，直接说明没有权限或无法处理。`;
}
