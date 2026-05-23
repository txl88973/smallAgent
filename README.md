# AgentHub Skill Console

AgentHub Skill Console 是面向智能体 Skill / Tool 调试场景的小型控制台。项目把 Skill 定义、Tool Calling、角色权限、执行追踪、结构化结果展示和人工确认写入串成一条完整链路，适合演示智能体业务能力如何从代码定义进入可观测的后端执行。

## 核心能力

- 流式 AI 对话：基于 Vercel AI SDK `useChat` / `streamText`。
- Skill Registry：将订单、物流、售后封装为后端可复用业务能力包。
- Tool Calling：模型按用户意图调用可见工具。
- Zod 参数校验：每个 Tool 使用 Zod schema 描述和校验入参。
- Role-based Tool Visibility：按 `user` / `admin` 过滤可用 Skill 和 Tool。
- Tool Trace：每次 Tool 执行写入 `ToolCallTrace`，右侧调试台可查看参数、结果、耗时和错误。
- PostgreSQL 持久化：订单、物流、售后工单、Skill 配置和 Trace 使用 Prisma + PostgreSQL。
- 工具结果组件化展示：通过 `renderType` 将 Tool Result 渲染为订单卡片、物流时间线、退款政策卡片和售后确认卡片。
- 写入类工具人工确认：售后工单先生成草稿，用户确认后才写入数据库。

## 技术栈

- Next.js
- TypeScript
- Vercel AI SDK
- Qwen / DashScope
- Zod
- Prisma
- PostgreSQL
- Tailwind CSS

## 本地运行

创建 `.env.local`：

```bash
DASHSCOPE_API_KEY=your-dashscope-api-key
DATABASE_URL="postgresql://postgres:postgres@localhost:55434/agenthub?schema=public"
```

安装依赖、启动数据库并初始化数据：

```bash
pnpm install
docker compose up -d
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

可选：查看数据库。

```bash
pnpm prisma:studio
```

## 演示用例

1. user 查询订单：
   - 切换到 `User`
   - 输入 `列出订单`
   - 观察订单列表卡片和右侧 Tool Trace。

2. user 查询物流：
   - 输入 `ORD-1001 的物流到哪了`
   - 观察物流时间线和 `viewTrackingInformation` trace。

3. admin 查询退款政策：
   - 切换到 `Admin`
   - 输入 `ORD-1001 能退款吗`
   - 观察退款政策卡片和 `getRefundPolicy` trace。

4. admin 生成售后工单草稿：
   - 输入 `帮我给 ORD-1001 创建售后工单，原因是包裹破损，优先级 normal`
   - 观察售后工单确认卡片。

5. admin 点击确认创建工单：
   - 点击确认卡片中的 `确认创建`
   - 观察正式工单结果卡片。
   - 右侧 Tool Trace 出现 `confirmAfterSalesTicket`。

6. 查看 Tool Trace：
   - 右侧 `Tool Trace` 展示最近 Tool 执行记录。
   - 展开 `查看 JSON` 可查看 args / result / errorMessage。

## 文档

- [架构说明](docs/ARCHITECTURE.md)
- [演示脚本](docs/DEMO_SCRIPT.md)
