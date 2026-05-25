"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { Role } from "../role-selector";
import { priorityLabel } from "./utils";
import { TicketResult, TicketResultCard } from "./TicketResultCard";

type TicketDraft = {
  orderNo?: string;
  reason?: string;
  priority?: "low" | "normal" | "high";
  confirmRequired?: boolean;
  message?: string;
};

export function TicketConfirmCard({
  data,
  role = "admin",
  onConfirmed,
}: {
  data: unknown;
  role?: Role;
  onConfirmed?: () => void;
}) {
  const draft = (data ?? {}) as TicketDraft;
  const [result, setResult] = useState<TicketResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (result) {
    return <TicketResultCard data={result} />;
  }

  if (isCancelled) {
    return (
      <div className="w-full max-w-[520px] rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          已取消售后工单草稿
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          未创建正式售后工单。
        </p>
      </div>
    );
  }

  const canConfirm = Boolean(draft.orderNo && draft.reason && draft.priority);

  const confirmTicket = async () => {
    if (!canConfirm || isConfirming) {
      return;
    }

    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post("/api/after-sales/confirm", {
          orderNo: draft.orderNo,
          reason: draft.reason,
          priority: draft.priority,
          requestedRole: role,
      });

      setResult(response.data as TicketResult);
      onConfirmed?.();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.error ??
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-amber-950 dark:text-amber-100">
            售后工单草稿
          </h3>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
            {draft.message ?? "确认后会创建正式售后工单。"}
          </p>
        </div>
        <span className="rounded bg-white/70 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900 dark:text-amber-100 dark:ring-amber-800">
          {draft.confirmRequired ? "需确认" : "草稿"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-amber-950 dark:text-amber-100">
        <div className="flex justify-between gap-4">
          <dt className="text-amber-700 dark:text-amber-300">订单号</dt>
          <dd>{draft.orderNo ?? "-"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-amber-700 dark:text-amber-300">优先级</dt>
          <dd>{priorityLabel(draft.priority)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm leading-6 text-amber-950 dark:text-amber-100">
        {draft.reason ?? "-"}
      </p>

      {errorMessage && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void confirmTicket();
          }}
          disabled={!canConfirm || isConfirming}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isConfirming ? "创建中" : "确认创建"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsCancelled(true);
          }}
          disabled={isConfirming}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-900"
        >
          取消
        </button>
      </div>
    </div>
  );
}
