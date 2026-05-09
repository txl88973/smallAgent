"use client";

import { useRef, useState } from "react";
import { Message } from "@/components/message";
import { RoleSelector, type Role } from "@/components/role-selector";
import { SkillPanel } from "@/components/skill-panel";
import { ToolCallRecords } from "@/components/tool-call-records";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { motion } from "framer-motion";
import { MasonryIcon, VercelIcon } from "@/components/icons";
import Link from "next/link";
import { useChat } from "ai/react";

export default function Home() {
  const { messages, handleSubmit, input, setInput, append } = useChat();
  const [role, setRole] = useState<Role>("user");

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

  return (
    <div className="h-dvh bg-white dark:bg-zinc-900">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-0 flex-col justify-between gap-4 pb-20">
          <div
            ref={messagesContainerRef}
            className="flex h-full min-h-0 w-full flex-col items-center gap-6 overflow-y-scroll"
          >
            {messages.length === 0 && (
              <motion.div className="h-[350px] px-4 w-full md:w-[500px] md:px-0 pt-20">
                <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
                  <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
                    <VercelIcon size={16} />
                    <span>+</span>
                    <MasonryIcon />
                  </p>
                  <p>
                    The maxSteps parameter of streamText function allows you to
                    automatically handle multiple tool calls in sequence using
                    the AI SDK in your application.
                  </p>
                  <p>
                    {" "}
                    Learn more about{" "}
                    <Link
                      className="text-blue-500 dark:text-blue-400"
                      href="https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling#multi-step-calls"
                      target="_blank"
                    >
                      Multiple Tool Steps{" "}
                    </Link>
                    from the Vercel AI SDK.
                  </p>
                </div>
              </motion.div>
            )}

            {messages.map((message) => (
              <Message
                key={message.id}
                role={message.role}
                content={message.content}
                toolInvocations={message.toolInvocations}
              ></Message>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[500px] mb-4">
            {messages.length === 0 &&
              suggestedActions.map((suggestedAction, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  key={index}
                  className={index > 1 ? "hidden sm:block" : "block"}
                >
                  <button
                    onClick={async () => {
                      append({
                        role: "user",
                        content: suggestedAction.action,
                      });
                    }}
                    className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                  >
                    <span className="font-medium">
                      {suggestedAction.title}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {suggestedAction.label}
                    </span>
                  </button>
                </motion.div>
              ))}
          </div>

          <form
            className="flex flex-col gap-2 relative items-center"
            onSubmit={handleSubmit}
          >
            <input
              ref={inputRef}
              className="bg-zinc-100 rounded-md px-2 py-1.5 w-full outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300 md:max-w-[500px] max-w-[calc(100dvw-32px)]"
              placeholder="Send a message..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
            />
          </form>
        </div>

        <aside className="min-h-0 overflow-y-auto border-t border-zinc-200 p-4 dark:border-zinc-800 lg:border-l lg:border-t-0">
          <div className="flex flex-col gap-4">
            <RoleSelector role={role} onRoleChange={setRole} />
            <SkillPanel role={role} />
            <ToolCallRecords />
          </div>
        </aside>
      </div>
    </div>
  );
}
