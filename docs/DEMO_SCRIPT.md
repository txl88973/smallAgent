# Demo Script

## 1. 启动项目

```bash
pnpm install
docker compose up -d
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

打开本地地址后，确认右侧面板能看到：

- Role 切换
- Skill Registry
- Tool Trace

## 2. 演示前准备

确认 `.env.local` 中有：

```bash
DASHSCOPE_API_KEY=your-dashscope-api-key
DATABASE_URL="postgresql://postgres:postgres@localhost:55434/agenthub?schema=public"
```

确认 seed 数据存在：

- `ORD-1001`：已签收
- `ORD-1002`：运输中
- `ORD-1003`：待发货

如果重复演示售后确认，可以接受数据库里存在多条售后工单；每次确认都会创建新的正式工单并写入 trace。

## 3. user 角色演示

### 查询订单

1. 选择 `User`。
2. 输入：

```text
列出订单
```

讲解点：

- 后端根据 role 只暴露 user 可见工具。
- 模型调用 `listOrders`。
- Tool 从 PostgreSQL 读取订单。
- 前端按 `order-list` 渲染订单列表卡片。
- 右侧 Tool Trace 出现 `listOrders success`。

### 查询物流

输入：

```text
ORD-1001 的物流到哪了
```

讲解点：

- 模型调用 `viewTrackingInformation`。
- Tool 查询 Order + Tracking。
- 前端按 `tracking-timeline` 渲染物流时间线。
- 右侧 Tool Trace 展示 args、result、latencyMs。

## 4. admin 角色演示

### 查询退款政策

1. 切换到 `Admin`。
2. 输入：

```text
ORD-1001 能退款吗？
```

讲解点：

- admin 能看到 after-sales Skill。
- 模型调用 `getRefundPolicy`。
- 后端根据签收时间判断是否仍在 7 天窗口内。
- 前端按 `refund-policy-card` 渲染退款政策卡片。

### 生成售后工单草稿

输入：

```text
帮我给 ORD-1001 创建售后工单，原因是包裹破损，优先级 normal
```

讲解点：

- 模型调用 `createAfterSalesTicketDraft`。
- 这个 Tool 是 write risk，但本阶段只生成草稿。
- 此时还没有写入 `AfterSalesTicket`。
- 前端出现 `TicketConfirmCard`。

### 确认创建工单

点击 `确认创建`。

讲解点：

- 前端调用 `/api/after-sales/confirm`。
- 接口校验 admin 权限。
- 接口写入 `AfterSalesTicket`。
- 接口写入 `confirmAfterSalesTicket` trace。
- 前端显示 `TicketResultCard`。
- 右侧 Tool Trace 刷新后出现确认记录。

## 5. 面试讲解要点

- Skill 是后端业务能力包，不只是前端分组。
- Tool 是模型可调用的最小执行单元。
- Tool 参数由 Zod schema 约束。
- 权限过滤在服务端完成，前端只是展示结果。
- Tool 执行统一经过 trace wrapper，便于审计和调试。
- `renderType` 将后端工具结果映射到前端业务组件。
- 写入类操作采用人工确认，降低模型误操作风险。

## 6. 常见追问回答

### 为什么不是自己手写 SSE？

Vercel AI SDK 已经处理了流式协议、tool call 状态、tool result 回传和前端 `useChat` 消费。项目重点是业务能力编排、权限、trace 和结果渲染，复用成熟 SDK 能减少协议层代码和边界 bug。

### Skill 和 Tool 有什么区别？

Skill 是业务能力包，包含多个 Tool、权限、提示策略和确认策略。Tool 是模型真正调用的执行单元，负责参数校验和业务执行。

### 权限控制是不是只在前端？

不是。后端 `/api/chat` 会按 role 计算 visible tools，只把当前角色可用工具传给模型。`/api/after-sales/confirm` 也会独立校验 admin 权限，user 直接调用会返回 403。

### 为什么创建工单要人工确认？

创建工单属于写入类动作，会改变业务数据。模型可以生成草稿，但正式写库需要用户确认，避免模型误判或参数不完整时直接产生业务影响。

### Tool Trace 有什么作用？

Tool Trace 用于观察模型调用了哪个工具、生成了什么参数、工具返回了什么结果、耗时多少、失败原因是什么。它是调试、审计和后续评估工具调用质量的基础数据。
