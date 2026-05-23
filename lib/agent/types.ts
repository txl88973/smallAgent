import type { z } from "zod";

export type Role = "admin" | "user";

export type RenderType =
  | "order-list"
  | "order-card"
  | "tracking-timeline"
  | "refund-policy-card"
  | "ticket-confirm-card"
  | "ticket-result-card";

export type ToolRiskLevel = "read" | "write";

export type ToolExecutionContext = {
  role: Role;
  conversationId?: string;
  skillId: string;
  skillName: string;
};

export type ToolDefinition<TParameters extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  description: string;
  parameters: TParameters;
  riskLevel: ToolRiskLevel;
  renderType: RenderType;
  execute: (
    args: z.infer<TParameters>,
    context: ToolExecutionContext,
  ) => Promise<unknown>;
};

export type AnyToolDefinition = ToolDefinition<any>;

export type SkillDefinition = {
  id: string;
  name: string;
  description: string;
  roles: Role[];
  tools: AnyToolDefinition[];
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
