# Architecture

AgentHub Skill Console 的核心目标是把智能体可调用能力从“前端展示分组”升级为后端可复用、可观测、可配置的业务能力包。

## 核心概念

### Skill

Skill 是业务能力包，不只是 UI 分组。一个 Skill 代表一组面向同一业务场景的工具、提示策略和权限边界。

当前内置 Skill：

- `order-query`：订单查询
- `logistics-tracking`：物流追踪
- `after-sales`：售后处理

Skill 的代码定义放在 `lib/agent/skills/*`，包含：

- Skill 元信息
- 允许角色
- Tool 列表
- promptPolicy
- confirmationPolicy

### Tool

Tool 是模型可调用的执行单元。每个 Tool 包含：

- `name`
- `description`
- `parameters`：Zod schema
- `riskLevel`
- `renderType`
- `execute`

模型只看到当前角色可见的 Tool。Tool 执行逻辑仍在源码中，不存入数据库。

### SkillConfig

`SkillConfig` 是运行配置表，不存 execute 函数。它负责控制：

- enabled
- allowedRoles
- sortOrder

后端会合并源码中的 SkillDefinition 和数据库中的 SkillConfig。如果数据库没有配置，则使用源码默认角色。

## 请求链路

1. 前端 `useChat` 将 `messages` 和当前 `role` 发送到 `/api/chat`。
2. 后端通过 `getEnabledSkills(role)` 获取当前角色可用 Skill。
3. 后端通过 `getVisibleTools(role)` 展开可见 Tool。
4. `toAiSdkTools` 将 ToolDefinition 转换为 Vercel AI SDK tools。
5. 模型根据 system prompt 和用户输入决定是否调用工具。
6. Tool 执行经过 `executeWithTrace` wrapper。
7. wrapper 执行真实业务逻辑，并写入 `ToolCallTrace`。
8. Tool result 以 `{ renderType, data }` 返回给前端。
9. 前端 `ToolResultRenderer` 根据 renderType 渲染结构化结果组件。

## 权限过滤

权限控制在后端执行，不依赖前端隐藏按钮。

```text
role -> enabledSkills -> visibleTools -> AI SDK tools
```

`user` 可用：

- `listOrders`
- `getOrderDetail`
- `viewTrackingInformation`

`admin` 额外可用：

- `getRefundPolicy`
- `createAfterSalesTicketDraft`

## Tool Trace

所有 AI Tool Calling 都经过 trace wrapper，写入 `ToolCallTrace`：

- skillId
- skillName
- toolName
- role
- args
- result
- status
- latencyMs
- errorMessage

右侧 `Tool Trace` 面板通过 `/api/tool-traces` 读取最近记录，用于调试模型选择、参数生成、业务执行结果和失败原因。

## renderType

Tool 返回值包含：

```ts
{
  renderType: string;
  data: unknown;
}
```

`renderType` 是后端 Tool 和前端组件之间的轻量展示协议。它让前端不需要理解每个工具的内部实现，只需要按类型选择组件：

- `order-list`
- `order-card`
- `tracking-timeline`
- `refund-policy-card`
- `ticket-confirm-card`
- `ticket-result-card`

## 写入类工具确认机制

写入类工具不直接修改业务数据。

`createAfterSalesTicketDraft` 只生成售后工单草稿，不写入 `AfterSalesTicket`。前端展示 `TicketConfirmCard`，用户点击确认后调用：

```text
POST /api/after-sales/confirm
```

确认接口会：

1. 校验 role，只允许 admin。
2. 校验订单存在。
3. 创建 `AfterSalesTicket`。
4. 写入一条 `confirmAfterSalesTicket` Tool Trace。
5. 返回正式工单结果。

这个模式避免模型在未确认时直接执行有业务影响的写入操作。
