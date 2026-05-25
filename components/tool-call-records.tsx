"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { Role } from "./role-selector";

type ToolTraceRecord = {
  id: string;
  conversationId: string | null;
  skillId: string;
  toolName: string;
  skillName: string;
  role: Role;
  status: "success" | "error";
  latencyMs: number | null;
  args: unknown;
  result: unknown;
  errorMessage: string | null;
  createdAt: string;
};

const getStatusClassName = (status: ToolTraceRecord["status"]) => {
  switch (status) {
    case "success":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900";
    case "error":
      return "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900";
  }
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const summarizeJson = (value: unknown) => {
  if (value === null || value === undefined) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    return keys.length > 0 ? keys.slice(0, 3).join(", ") : "{}";
  }

  return String(value);
};

const formatJson = (value: unknown) => {
  return JSON.stringify(value, null, 2);
};

export const ToolCallRecords = ({
  conversationId,
  refreshKey,
}: {
  conversationId?: string;
  refreshKey?: number;
}) => {
  const [records, setRecords] = useState<ToolTraceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const url = new URL("/api/tool-traces", window.location.origin);

      if (conversationId) {
        url.searchParams.set("conversationId", conversationId);
      }

      const response = await apiClient.get<ToolTraceRecord[]>(
        `${url.pathname}${url.search}`,
      );

      setRecords(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords, refreshKey]);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Tool Trace
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            最近工具执行记录、参数和结果
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadRecords();
          }}
          className="shrink-0 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
          disabled={isLoading}
        >
          {isLoading ? "刷新中" : "刷新"}
        </button>
      </div>

      {errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      {!isLoading && records.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          暂无工具调用记录
        </p>
      ) : (
        <ul aria-label="Tool trace records" className="flex flex-col gap-2">
          {records.map((record) => (
            <li
              key={record.id}
              className="min-w-0 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-all text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {record.toolName}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(record.createdAt)}
                    {typeof record.latencyMs === "number"
                      ? ` · ${record.latencyMs}ms`
                      : ""}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${getStatusClassName(
                    record.status,
                  )}`}
                >
                  {record.status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{record.skillName}</span>
                <span aria-hidden="true">/</span>
                <span>{record.skillId}</span>
                <span aria-hidden="true">/</span>
                <span>role: {record.role}</span>
              </div>

              <div className="mt-2 space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                <p className="break-words">args: {summarizeJson(record.args)}</p>
                <p className="break-words">
                  result: {summarizeJson(record.result)}
                </p>
                {record.errorMessage && (
                  <p className="break-words text-red-700 dark:text-red-300">
                    error: {record.errorMessage}
                  </p>
                )}
              </div>

              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                  查看 JSON
                </summary>
                <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-zinc-50 p-2 text-[11px] leading-5 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                  {formatJson({
                    args: record.args,
                    result: record.result,
                    errorMessage: record.errorMessage,
                  })}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
