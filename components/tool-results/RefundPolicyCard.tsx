"use client";

import { formatDateTime } from "./utils";

type RefundPolicy = {
  orderNo?: string;
  refundable?: boolean;
  reason?: string;
  deadline?: string | null;
};

export function RefundPolicyCard({ data }: { data: unknown }) {
  const policy = (data ?? {}) as RefundPolicy;
  const refundable = Boolean(policy.refundable);

  return (
    <div className="w-full max-w-[520px] rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            退款政策 · {policy.orderNo ?? "-"}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {policy.reason ?? "-"}
          </p>
        </div>

        <span
          className={
            refundable
              ? "shrink-0 rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900"
              : "shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700"
          }
        >
          {refundable ? "可售后" : "不可售后"}
        </span>
      </div>

      {policy.deadline && (
        <p className="mt-3 rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
          售后截止：{formatDateTime(policy.deadline)}
        </p>
      )}
    </div>
  );
}
