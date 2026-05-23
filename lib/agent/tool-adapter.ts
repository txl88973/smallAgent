import type { CoreTool } from "ai";

import type { Role, SkillDefinition, ToolDefinition } from "./types";

type VisibleTool = {
  skill: SkillDefinition;
  tool: ToolDefinition;
};

type ToolAdapterContext = {
  role: Role;
  conversationId?: string;
};

export function toAiSdkTools(
  visibleTools: VisibleTool[],
  context: ToolAdapterContext,
) {
  return visibleTools.reduce<Record<string, CoreTool>>(
    (tools, { skill, tool }) => {
      tools[tool.name] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: async (args) => {
          return tool.execute(args, {
            role: context.role,
            conversationId: context.conversationId,
            skillId: skill.id,
            skillName: skill.name,
          });
        },
      };

      return tools;
    },
    {},
  );
}
