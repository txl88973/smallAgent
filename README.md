# smallAgent

这是我的 Agent Skill 调试台学习实践项目，用来练习 Next.js、TypeScript、Vercel AI SDK Tool Calling 和 Qwen / DashScope 模型调用的组合使用。

项目在原聊天示例基础上做了轻量二次开发，当前包含：

- 基于 `useChat` 的聊天交互。
- Qwen 模型调用，使用 `DASHSCOPE_API_KEY` 作为环境变量。
- 已跑通的查询类工具调用：`listOrders`、`viewTrackingInformation`。
- Agent Skill 调试侧边栏：角色切换、Skill / Tool 分组、mock 调用记录。
- `admin` / `user` 两种角色视角；普通用户只能查看查询类 Skill，运维类 Skill 显示无权限。

## 本地运行

创建 `.env.local`：

```bash
DASHSCOPE_API_KEY=your-dashscope-api-key
```

安装依赖并启动：

```bash
pnpm install
pnpm dev
```

本地数据库（PostgreSQL + Prisma）：

```bash
docker compose up -d
pnpm prisma:migrate
pnpm prisma:seed
pnpm prisma:studio
```

打开本地开发服务后，可以在聊天区测试订单查询和物流追踪，也可以在右侧调试台切换角色查看 Skill 权限展示。

## 技术栈

- Next.js
- TypeScript
- Tailwind CSS
- Vercel AI SDK
- Qwen / DashScope
