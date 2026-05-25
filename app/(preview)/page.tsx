"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Message } from "@/components/message";
import { SkillPanel } from "@/components/skill-panel";
import { ToolCallRecords } from "@/components/tool-call-records";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { refreshClient, authFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/auth-store";
import { motion } from "framer-motion";
import { useChat } from "ai/react";

export default function Home() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}

function HomeContent() {
  const router = useRouter();
  const { user, accessToken, clearAuth } = useAuthStore();
  const [toolTraceRefreshKey, setToolTraceRefreshKey] = useState(0);
  const { messages, handleSubmit, input, setInput, append } = useChat({
    fetch: authFetch,
    credentials: "same-origin",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const suggestedActions = [
    {
      title: "Where is",
      label: "my watch?",
      action: "where is my watch?",
    },
    {
      title: "What orders",
      label: "have shipped?",
      action: "what orders have shipped?",
    },
  ];
  const currentRole = user?.role ?? "user";
  const availableTools =
    currentRole === "admin"
      ? [
          "listOrders",
          "getOrderDetail",
          "viewTrackingInformation",
          "getRefundPolicy",
          "createAfterSalesTicketDraft",
        ]
      : ["listOrders", "getOrderDetail", "viewTrackingInformation"];

  const handleLogout = async () => {
    await refreshClient.post("/api/auth/logout").catch(() => null);
    clearAuth();
    router.replace("/login");
  };

  return (
    <div className="min-h-dvh bg-white dark:bg-zinc-900">
      <div className="flex min-h-dvh flex-col lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_360px]">
        <main
          aria-label="AI Tool Calling chat console"
          className="flex min-h-dvh flex-col lg:min-h-0 lg:overflow-hidden"
        >
          <div
            ref={messagesContainerRef}
            className="flex w-full flex-1 flex-col items-center gap-6 overflow-visible pb-6 lg:min-h-0 lg:overflow-y-auto"
          >
            {messages.length === 0 && (
              <motion.section
                aria-labelledby="empty-state-title"
                className="w-full px-4 pt-8 md:max-w-[560px] md:px-0 lg:pt-20"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:p-5">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      AI Tool Calling Console
                    </p>
                    <h1
                      id="empty-state-title"
                      className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
                    >
                      Agent Skill 调试台
                    </h1>
                    <p className="leading-6">
                      用一段 prompt 观察模型如何选择本地 tools，并串联订单查询和物流追踪。
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Current role
                      </p>
                      <p className="mt-1 font-medium text-zinc-950 dark:text-zinc-50">
                        {user?.username ?? "-"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                        role: {currentRole}
                      </p>
                    </div>

                    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Testable tools
                      </p>
                      <p className="mt-1 break-words font-medium text-zinc-950 dark:text-zinc-50">
                        {availableTools.join(", ")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                        输入订单或物流问题来触发 tool calling。
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Try a prompt
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {suggestedActions.map((suggestedAction) => (
                        <button
                          key={suggestedAction.action}
                          type="button"
                          onClick={() => {
                            append({
                              role: "user",
                              content: suggestedAction.action,
                            });
                          }}
                          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus:ring-zinc-100 dark:focus:ring-offset-zinc-900"
                        >
                          <span className="block font-medium">
                            {suggestedAction.title}
                          </span>
                          <span className="block text-zinc-600 dark:text-zinc-300">
                            {suggestedAction.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                    也可以在下方输入自己的 prompt 开始调试。
                  </p>
                </div>
              </motion.section>
            )}

            {messages.map((message) => (
              <Message
                key={message.id}
                role={message.role}
                content={message.content}
                toolInvocations={message.toolInvocations}
                currentRole={currentRole}
                onToolResultConfirmed={() => {
                  setToolTraceRefreshKey((key) => key + 1);
                }}
              ></Message>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 lg:static lg:border-t-0 lg:px-0 lg:pb-10 lg:pt-0"
            onSubmit={handleSubmit}
          >
            <label htmlFor="chat-prompt" className="sr-only">
              Send a prompt to the agent
            </label>
            <input
              id="chat-prompt"
              name="prompt"
              aria-label="Send a prompt to the agent"
              ref={inputRef}
              className="mx-auto h-10 w-full max-w-[560px] rounded-md border border-transparent bg-zinc-100 px-3 py-2 text-zinc-800 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-400 dark:focus:border-zinc-600 dark:focus:bg-zinc-900 dark:focus:ring-zinc-100/20"
              placeholder="Send a message..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
            />
          </form>
        </main>

        <aside className="border-t border-zinc-200 p-4 dark:border-zinc-800 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="flex flex-col gap-4">
            <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Current User
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  登录态决定可用 Skill / Tool
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {user?.username}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  role: {currentRole}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                className="h-9 rounded-md border border-zinc-200 px-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Logout
              </button>
            </section>
            <SkillPanel role={currentRole} />
            <ToolCallRecords refreshKey={toolTraceRefreshKey} />
          </div>
        </aside>
      </div>
    </div>
  );
}
